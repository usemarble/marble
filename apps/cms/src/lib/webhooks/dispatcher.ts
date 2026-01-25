import type { WebhookEvent as WebhookValidationEvent } from "../validations/webhook";
import {
  checkWebhookUsage,
  notifyUsageThreshold,
  trackWebhookUsage,
} from "./usage";
import { getWebhooks } from "./utils";
import { WebhookClient } from "./webhook-client";

interface WebhookEventMap {
  "post.published": { id: string; title: string; slug: string; userId: string };
  "post.updated": { id: string; title: string; slug: string; userId: string };
  "post.deleted": { id: string; slug: string; userId: string };
  "category.created": { id: string; slug: string; userId: string };
  "category.updated": { id: string; slug: string; userId: string };
  "category.deleted": { id: string; slug: string; userId: string };
  "tag.created": { id: string; slug: string; userId: string };
  "tag.updated": { id: string; slug: string; userId: string };
  "tag.deleted": { id: string; slug: string; userId: string };
  "media.uploaded": {
    id: string;
    name: string;
    userId: string;
    size: number;
    type: "image" | "video" | "audio" | "document";
  };
  "media.deleted": { id: string; name: string; userId: string };
}

interface DispatchWebhooksArgs<K extends keyof WebhookEventMap> {
  workspaceId: string;
  validationEvent: WebhookValidationEvent;
  deliveryEvent: K;
  payload: WebhookEventMap[K] | WebhookEventMap[K][];
}

interface DispatchResult {
  delivered: number;
  blocked: number;
  limitReached: boolean;
}

export async function dispatchWebhooks<K extends keyof WebhookEventMap>({
  workspaceId,
  validationEvent,
  deliveryEvent,
  payload,
}: DispatchWebhooksArgs<K>): Promise<DispatchResult> {
  if (!workspaceId) {
    return { delivered: 0, blocked: 0, limitReached: false };
  }

  const payloads = Array.isArray(payload) ? payload : [payload];

  if (payloads.length === 0) {
    return { delivered: 0, blocked: 0, limitReached: false };
  }

  const webhooks = await getWebhooks(workspaceId, validationEvent);

  if (!webhooks.length) {
    return { delivered: 0, blocked: 0, limitReached: false };
  }

  // Check usage limits before dispatching
  const usageCheck = await checkWebhookUsage(workspaceId);

  if (!usageCheck.allowed) {
    console.log(
      `[WebhookDispatcher] Blocked: workspace ${workspaceId} at limit (${usageCheck.currentUsage}/${usageCheck.limit})`
    );

    // Send 100% threshold notification if not already sent
    if (usageCheck.thresholdCrossed === 100) {
      notifyUsageThreshold(
        workspaceId,
        100,
        usageCheck.currentUsage,
        usageCheck.limit,
        usageCheck.plan
      ).catch((err) =>
        console.error(
          "[WebhookDispatcher] Failed to send limit notification:",
          err
        )
      );
    }

    return {
      delivered: 0,
      blocked: webhooks.length * payloads.length,
      limitReached: true,
    };
  }

  // Check if we're crossing a threshold
  if (usageCheck.thresholdCrossed) {
    notifyUsageThreshold(
      workspaceId,
      usageCheck.thresholdCrossed,
      usageCheck.currentUsage + 1,
      usageCheck.limit,
      usageCheck.plan
    ).catch((err) =>
      console.error(
        "[WebhookDispatcher] Failed to send threshold notification:",
        err
      )
    );
  }

  // Calculate how many webhooks we can still send
  const remainingQuota = usageCheck.limit - usageCheck.currentUsage;
  const totalDeliveries = webhooks.length * payloads.length;
  const sendable = Math.max(0, Math.min(remainingQuota, totalDeliveries));
  const blockedCount = totalDeliveries - sendable;

  let deliveredCount = 0;
  let reservedCount = 0;

  const deliveries: Promise<void>[] = [];

  for (const webhook of webhooks) {
    const client = new WebhookClient({ secret: webhook.secret });
    for (const data of payloads) {
      // Check if we've exceeded quota mid-dispatch
      if (reservedCount >= sendable) {
        // All remaining are blocked
        continue;
      }

      reservedCount++;
      deliveries.push(
        (async () => {
          try {
            await client.send({
              url: webhook.endpoint,
              event: deliveryEvent,
              data,
              format: webhook.format,
            });
            await trackWebhookUsage({
              workspaceId,
              endpoint: webhook.endpoint,
              event: deliveryEvent,
              webhookId: webhook.id,
              format: webhook.format,
            });
            deliveredCount++;
          } catch (error) {
            console.error(
              `[WebhookDispatcher] Failed to deliver ${deliveryEvent} webhook to ${webhook.endpoint}`,
              error
            );
          }
        })()
      );
    }
  }

  if (blockedCount > 0) {
    console.log(
      `[WebhookDispatcher] Quota exhausted mid-dispatch, blocked ${blockedCount} remaining webhooks`
    );
  }

  await Promise.allSettled(deliveries).catch((error) => {
    console.error(
      "[WebhookDispatcher] Error in background webhook delivery:",
      error
    );
  });

  return {
    delivered: deliveredCount,
    blocked: blockedCount,
    limitReached: blockedCount > 0,
  };
}
