import { db } from "@marble/db";
import { createPolarClient } from "../polar/client";

interface TrackWebhookUsageArgs {
  workspaceId: string | null | undefined;
  endpoint: string;
  event: string;
  webhookId: string;
  format: string;
  status?: "success" | "failure";
}

export async function trackWebhookUsage({
  workspaceId,
  endpoint,
  event,
  webhookId,
  format,
}: TrackWebhookUsageArgs) {
  if (!workspaceId) {
    return;
  }

  const polarClient = createPolarClient();

  try {
    await db.usageEvent.create({
      data: {
        type: "webhook_delivery",
        workspaceId,
        endpoint,
      },
    });
  } catch (error) {
    console.error("[WebhookUsage] Failed to store usage event:", error);
  }

  let customerId = workspaceId;

  try {
    const organization = await db.organization.findFirst({
      where: {
        id: workspaceId,
      },
      select: {
        members: {
          where: {
            role: "owner",
          },
          select: {
            userId: true,
          },
        },
      },
    });
    if (organization?.members[0]?.userId) {
      customerId = organization.members[0].userId;
    }
  } catch (error) {
    console.error("[WebhookUsage] Failed to get customer ID:", error);
  }

  if (polarClient) {
    try {
      await polarClient.events.ingest({
        events: [
          {
            name: "webhook_delivery",
            externalCustomerId: customerId,
            metadata: {
              workspaceId,
              endpoint,
              event,
              webhookId,
              format,
            },
          },
        ],
      });
    } catch (error) {
      console.error("[WebhookUsage] Failed to ingest Polar event:", error);
    }
  }
}
