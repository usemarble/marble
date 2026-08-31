import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import { APIError } from "better-auth/api";
import { and, desc, eq, gt, or } from "drizzle-orm";

export async function checkWorkspaceSubscription(workspaceId: string) {
  const foundSubscription = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.workspaceId, workspaceId),
      or(
        eq(subscription.status, "active"),
        eq(subscription.status, "trialing"),
        and(
          eq(subscription.status, "canceled"),
          eq(subscription.cancelAtPeriodEnd, true),
          gt(subscription.currentPeriodEnd, new Date())
        )
      )
    ),
    orderBy: desc(subscription.createdAt),
  });

  return Boolean(foundSubscription);
}

export async function guardWorkspaceSubscription(
  workspaceId: string,
  message: string
) {
  const hasValidSubscription = await checkWorkspaceSubscription(workspaceId);

  if (!hasValidSubscription) {
    throw new APIError("FORBIDDEN", {
      message,
    });
  }
}
