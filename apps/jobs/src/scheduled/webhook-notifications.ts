import { env } from "cloudflare:workers";
import { createDbClient } from "@/lib/db";
import {
  queueWebhookFailureNotifications,
  sendPendingWebhookNotifications,
} from "@/lib/webhook-notifications";

export async function handleWebhookNotifications() {
  const db = await createDbClient();
  await queueWebhookFailureNotifications(db, env.APP_URL);
  await sendPendingWebhookNotifications(db, env.RESEND_API_KEY);
}
