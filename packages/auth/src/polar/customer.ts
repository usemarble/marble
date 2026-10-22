import type { RequestOptions } from "@polar-sh/sdk";
import type { PolarCore } from "@polar-sh/sdk/2026-10";
import {
  createCustomers,
  deleteExternalCustomers,
  listCustomers,
  updateCustomers,
  updateExternalCustomers,
} from "@polar-sh/sdk/2026-10/services/customers";
import type { User } from "better-auth";
import type { AuthEnv } from "../env";

const requestOptions = { timeout: 3 } satisfies RequestOptions;

interface CustomerSyncOptions {
  polar: PolarCore;
  env: Pick<AuthEnv, "MODE" | "POLAR_ACCESS_TOKEN">;
  user: Pick<User, "id" | "email" | "name">;
}

function canSyncCustomers(env: CustomerSyncOptions["env"]) {
  if (env.MODE !== "production") {
    return false;
  }
  if (!env.POLAR_ACCESS_TOKEN?.trim()) {
    console.warn(
      "[Billing] POLAR_ACCESS_TOKEN is missing; customer sync skipped"
    );
    return false;
  }
  return true;
}

export async function createPolarCustomer({
  polar,
  env,
  user,
}: CustomerSyncOptions) {
  if (!canSyncCustomers(env)) {
    return;
  }

  try {
    const customers = await listCustomers(polar)(
      { email: user.email },
      requestOptions
    );
    const existing = customers.items.find(
      (customer) => customer.type === "individual"
    );
    if (existing) {
      if (existing.external_id === user.id) {
        return;
      }
      if (existing.external_id !== null) {
        console.warn("[Billing] Polar customer belongs to another user", {
          userId: user.id,
          customerId: existing.id,
        });
        return;
      }
      await updateCustomers(polar)(
        existing.id,
        { external_id: user.id },
        requestOptions
      );
      return;
    }
    if (customers.items.some((customer) => customer.type === "team")) {
      console.warn("[Billing] Polar customer belongs to a team", {
        userId: user.id,
      });
      return;
    }
    await createCustomers(polar)(
      { email: user.email, name: user.name, external_id: user.id },
      requestOptions
    );
  } catch (error) {
    console.error("[Billing] Polar customer creation failed", {
      userId: user.id,
      error,
    });
  }
}

export async function updatePolarCustomer({
  polar,
  env,
  user,
}: CustomerSyncOptions) {
  if (!canSyncCustomers(env)) {
    return;
  }
  try {
    await updateExternalCustomers(polar)(
      user.id,
      { email: user.email, name: user.name },
      requestOptions
    );
  } catch (error) {
    console.error("[Billing] Polar customer update failed", {
      userId: user.id,
      error,
    });
  }
}

export async function deletePolarCustomer({
  polar,
  env,
  user,
}: CustomerSyncOptions) {
  if (!canSyncCustomers(env)) {
    return;
  }
  try {
    await deleteExternalCustomers(polar)(user.id, undefined, requestOptions);
  } catch (error) {
    console.error("[Billing] Polar customer deletion failed", {
      userId: user.id,
      error,
    });
  }
}
