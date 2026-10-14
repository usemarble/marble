import { authClient } from "@/lib/auth/client";
import type { Workspace } from "@/types/workspace";

export type BillingPlanSlug = "hobby" | "hobby-yearly" | "pro" | "pro-yearly";

async function openPortal() {
  const result = await authClient.customer.portal();
  if (result.error) {
    throw new Error(result.error.message ?? "Failed to open billing");
  }
}

/** All upgrades use the same rule, with a server fallback for stale UI data. */
export async function openWorkspaceBilling(
  workspace: Pick<Workspace, "id" | "hasSubscription">,
  plan?: BillingPlanSlug
) {
  if (workspace.hasSubscription || !plan) {
    await openPortal();
    return;
  }
  const result = await authClient.checkout({
    slug: plan,
    reference_id: workspace.id,
  });
  if (result.error?.code === "WORKSPACE_SUBSCRIPTION_EXISTS") {
    await openPortal();
    return;
  }
  if (result.error) {
    throw new Error(result.error.message ?? "Failed to start checkout");
  }
}
