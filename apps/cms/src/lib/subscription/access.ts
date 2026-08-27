import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import { activeSubscriptionWhere } from "@marble/drizzle/subscription-filters";
import { and, desc, eq } from "@marble/drizzle/operators";
import { APIError } from "better-auth/api";

export async function checkWorkspaceSubscription(workspaceId: string) {
  const foundSubscription = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.workspaceId, workspaceId),
      activeSubscriptionWhere()
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
