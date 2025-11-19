import type { WebhookEvent as WebhookValidationEvent } from "../validations/webhook";
import { trackWebhookUsage } from "./usage";
import { getWebhooks } from "./utils";
import { WebhookClient } from "./webhook-client";

type WebhookEventMap = {
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
};

type DispatchWebhooksArgs<K extends keyof WebhookEventMap> = {
  workspaceId: string;
  validationEvent: WebhookValidationEvent;
  deliveryEvent: K;
  payload: WebhookEventMap[K] | WebhookEventMap[K][];
};

export async function dispatchWebhooks<K extends keyof WebhookEventMap>({
  workspaceId,
  validationEvent,
  deliveryEvent,
  payload,
}: DispatchWebhooksArgs<K>) {
  if (!workspaceId) {
    return;
  }

  const payloads = Array.isArray(payload) ? payload : [payload];

  if (payloads.length === 0) {
    return;
  }

  const webhooks = await getWebhooks(workspaceId, validationEvent);

  if (!webhooks.length) {
    return;
  }

  const deliveries: Promise<void>[] = [];

  for (const webhook of webhooks) {
    const client = new WebhookClient({ secret: webhook.secret });
    for (const data of payloads) {
      deliveries.push(
        (async () => {
          const body = { event: deliveryEvent, data };

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

  Promise.allSettled(deliveries).catch((error) => {
    console.error(
      "[WebhookDispatcher] Error in background webhook delivery:",
      error
    );
  });
}
