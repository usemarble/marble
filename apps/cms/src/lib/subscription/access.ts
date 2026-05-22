import { db } from "@marble/db";
import { APIError } from "better-auth/api";

export async function checkWorkspaceSubscription(workspaceId: string) {
  const subscription = await db.subscription.findFirst({
    where: {
      workspaceId,
      OR: [
        { status: "active" },
        { status: "trialing" },
        {
          status: "canceled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: { gt: new Date() },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return Boolean(subscription);
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
