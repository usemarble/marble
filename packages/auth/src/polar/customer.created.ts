import type { webhooks } from "@polar-sh/sdk/2026-10";

export async function handleCustomerCreated(
  payload: webhooks.WebhookCustomerCreatedPayload
) {
  const { data: customer } = payload;
  try {
    console.log("Customer Created", customer);
  } catch (error) {
    console.error("Error processing customer creation:", error);
  }
}
