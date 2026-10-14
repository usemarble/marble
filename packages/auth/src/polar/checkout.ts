import type { DbClient } from "@marble/db";
import { member, subscription } from "@marble/db/schema";
import type { models, PolarCore } from "@polar-sh/sdk/2026-10";
import {
  createCheckouts,
  getCheckouts,
  iterListCheckouts,
  updateCheckouts,
} from "@polar-sh/sdk/2026-10/services/checkouts";
import { iterListSubscriptions } from "@polar-sh/sdk/2026-10/services/subscriptions";
import type { Redis } from "@upstash/redis";
import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import type { AuthEnv } from "../env";
import { ongoingSubscriptionFilter } from "../subscription";

const requestOptions = { timeout: 20 };
const releaseLock =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0";
const renewLock =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], 120) end return 0";

function subscriptionExists(): never {
  throw new APIError("CONFLICT", {
    code: "WORKSPACE_SUBSCRIPTION_EXISTS",
    message: "This workspace already has a subscription. Manage it in billing.",
  });
}

function billingUnavailable(): never {
  throw new APIError("SERVICE_UNAVAILABLE", {
    message: "Unable to verify billing right now. Please try again later.",
  });
}

function isOngoing(found: models.Subscription) {
  if (found.ended_at) {
    return false;
  }
  if (found.status === "canceled") {
    return (
      new Date(found.ends_at ?? found.current_period_end ?? 0) > new Date()
    );
  }
  return found.status !== "incomplete_expired";
}

interface PendingCheckout {
  id?: string;
  userId: string;
}

/**
 * Owns checkout creation so a lock covers both the Polar check and the write.
 * The reservation outlives the lock; repeat requests resume the same checkout.
 */
export async function startWorkspaceCheckout({
  db,
  redis,
  polar,
  env,
  userId,
  body,
}: {
  db: DbClient;
  redis: Redis;
  polar: PolarCore;
  env: AuthEnv;
  userId: string;
  body: Record<string, unknown>;
}) {
  const workspaceId = body.reference_id;
  if (typeof workspaceId !== "string" || !workspaceId.trim()) {
    throw new APIError("BAD_REQUEST", {
      message: "A workspace is required to start checkout",
    });
  }

  const owner = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, workspaceId),
      eq(member.userId, userId)
    ),
    columns: { role: true },
  });
  if (owner?.role !== "owner") {
    throw new APIError("FORBIDDEN", {
      message: "Only workspace owners can start checkout",
    });
  }

  const products: Record<string, string> = {
    hobby: env.POLAR_HOBBY_MONTHLY_PRODUCT_ID,
    "hobby-yearly": env.POLAR_HOBBY_YEARLY_PRODUCT_ID,
    pro: env.POLAR_PRO_MONTHLY_PRODUCT_ID,
    "pro-yearly": env.POLAR_PRO_YEARLY_PRODUCT_ID,
  };
  const productId =
    typeof body.slug === "string" && Object.hasOwn(products, body.slug)
      ? products[body.slug]
      : undefined;
  if (
    !productId ||
    (body.redirect !== undefined && typeof body.redirect !== "boolean")
  ) {
    throw new APIError("BAD_REQUEST", { message: "Invalid checkout request" });
  }

  const existing = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.workspaceId, workspaceId),
      ongoingSubscriptionFilter()
    ),
    columns: { id: true },
  });
  if (existing) {
    subscriptionExists();
  }

  // Dev can contain production IDs and share Redis with another environment.
  const key = `billing:checkout:${env.MODE}:${env.POLAR_SERVER}:${workspaceId}`;
  const lockKey = `${key}:lock`;
  const token = crypto.randomUUID();
  let locked: boolean;
  try {
    locked = (await redis.set(lockKey, token, { nx: true, ex: 120 })) === "OK";
  } catch {
    billingUnavailable();
  }
  if (!locked) {
    throw new APIError("CONFLICT", {
      message: "Checkout is already being prepared. Please try again shortly.",
    });
  }

  try {
    const endedCheckoutIds = new Set<string>();
    // Query by workspace metadata, rather than assuming the current owner paid.
    for await (const found of iterListSubscriptions(polar)(
      { metadata: { referenceId: workspaceId }, limit: 100 },
      requestOptions
    )) {
      if (isOngoing(found)) {
        subscriptionExists();
      }
      if (found.checkout_id) {
        endedCheckoutIds.add(found.checkout_id);
      }
    }

    const pending = await redis.get<PendingCheckout>(key);
    let checkout: models.Checkout | undefined;
    if (pending?.id && !endedCheckoutIds.has(pending.id)) {
      checkout = await getCheckouts(polar)(pending.id, requestOptions);
    }
    if (!checkout) {
      // Recover checkouts created before this guard, or before a lost response.
      for await (const found of iterListCheckouts(polar)(
        {
          external_customer_id: pending?.userId ?? userId,
          status: ["open", "confirmed"],
          limit: 100,
        },
        requestOptions
      )) {
        if (
          found.metadata.referenceId === workspaceId &&
          (found.status === "confirmed" ||
            new Date(found.expires_at) > new Date())
        ) {
          if (found.status === "confirmed") {
            throw new APIError("CONFLICT", {
              message:
                "Your payment is still processing. Please wait before trying again.",
            });
          }
          if (checkout) {
            throw new APIError("CONFLICT", {
              message:
                "Multiple checkouts were found for this workspace. Please contact support.",
            });
          }
          checkout = found;
        }
      }
    }
    if (checkout?.status === "succeeded") {
      subscriptionExists();
    }
    if (checkout?.status === "confirmed") {
      throw new APIError("CONFLICT", {
        message:
          "Your payment is still processing. Please wait before trying again.",
      });
    }
    if (
      checkout?.status === "open" &&
      new Date(checkout.expires_at) > new Date()
    ) {
      if (checkout.external_customer_id !== userId) {
        throw new APIError("CONFLICT", {
          message:
            "Another workspace owner already has a checkout in progress.",
        });
      }
      if (checkout.product_id !== productId) {
        if (!checkout.products.some((product) => product.id === productId)) {
          throw new APIError("CONFLICT", {
            message:
              "A checkout for another plan is already open. Return to that checkout to continue.",
          });
        }
        checkout = await updateCheckouts(polar)(
          checkout.id,
          { product_id: productId },
          requestOptions
        );
      }
    } else {
      // A timed-out create can still have reached Polar. Keep its reservation
      // until it can be recovered, rather than risking a second payment link.
      if (pending && !pending.id) {
        billingUnavailable();
      }
      if (!(await redis.eval(renewLock, [lockKey], [token]))) {
        billingUnavailable();
      }
      await redis.set(key, { userId } satisfies PendingCheckout, {
        ex: 86_400,
      });
      try {
        checkout = await createCheckouts(polar)(
          {
            external_customer_id: userId,
            products: [
              productId,
              ...Object.values(products).filter((id) => id !== productId),
            ],
            metadata: { referenceId: workspaceId },
            success_url: env.POLAR_SUCCESS_URL,
            return_url: env.APP_URL,
            allow_discount_codes: true,
          },
          requestOptions
        );
      } catch (error) {
        // A validation rejection definitively did not create a checkout.
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          typeof error.statusCode === "number" &&
          [400, 401, 403, 404, 422].includes(error.statusCode)
        ) {
          await redis.del(key);
        }
        throw error;
      }
    }
    await redis.set(
      key,
      { id: checkout.id, userId } satisfies PendingCheckout,
      {
        ex: Math.max(
          86_400,
          Math.ceil(
            (new Date(checkout.expires_at).getTime() - Date.now()) / 1000
          )
        ),
      }
    );
    return { url: checkout.url, redirect: body.redirect ?? true };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error("[Billing] Could not prepare workspace checkout", error);
    billingUnavailable();
  } finally {
    await redis.eval(releaseLock, [lockKey], [token]).catch((error) => {
      console.error("[Billing] Could not release checkout lock", error);
    });
  }
}
