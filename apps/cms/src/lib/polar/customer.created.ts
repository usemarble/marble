"use server";

import type { WebhookCustomerCreatedPayload } from "@polar-sh/sdk/models/components/webhookcustomercreatedpayload.js";

export async function handleCustomerCreated(
  payload: WebhookCustomerCreatedPayload
) {
  const { data: customer } = payload;
  try {
    console.log("Customer Created", customer);
  } catch (error) {
    console.error("Error processing customer creation:", error);
  }
}
