import type { RouterOutputs } from "@marble/api/routers";

export type WebhookListItem = RouterOutputs["webhooks"]["list"][number];
export type Webhook = RouterOutputs["webhooks"]["get"]["webhook"];
export type WebhookDetailResponse = RouterOutputs["webhooks"]["get"];
export type WebhookDelivery = WebhookDetailResponse["deliveries"][number];
export type WebhookDeliveryAttempt = WebhookDelivery["attempts"][number];
