import { clearWorkspacePlan } from "@marble/auth/access";
import { workspace } from "@marble/db/schema";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import type { ServiceContext } from "../context";

export class BillingError extends Error {}

/**
 * Checkout redirects aren't proof of payment. Polar's webhook owns subscription
 * writes; this only clears cached reads and returns the authorized workspace
 * for the success page.
 */
export async function completeCheckout(
  ctx: ServiceContext,
  workspaceId: string
) {
  const found = await ctx.db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: { slug: true, name: true },
  });
  if (!found) {
    throw new BillingError("Workspace not found");
  }

  const redis = new Redis({
    url: ctx.env.REDIS_URL,
    token: ctx.env.REDIS_TOKEN,
  });
  await Promise.all([
    // The old usage relay cleared this API usage metadata key. Dashboard
    // metrics themselves are uncached; keep the existing key name.
    redis
      .del(`usage:meta:${workspaceId}`)
      .catch((error) => {
        console.error("[Billing] Failed to clear usage metadata:", error);
      }),
    // Webhooks also clear this; clear again if the redirect arrives first.
    clearWorkspacePlan(redis, workspaceId),
  ]);
  return { slug: found.slug, name: found.name };
}
