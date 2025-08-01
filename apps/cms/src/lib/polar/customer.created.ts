"use server";

import type { WebhookCustomerCreatedPayload } from "@polar-sh/sdk/models/components/webhookcustomercreatedpayload.js";

/**
 * Handles a customer creation webhook event by logging the customer data.
 *
 * @param payload - The webhook payload containing customer information
 */
export async function handleCustomerCreated(
  payload: WebhookCustomerCreatedPayload,
) {
  const { data: customer } = payload;
  try {
    console.log("Customer Created", customer);
  } catch (error) {
    console.error("Error updating subscription to canceled in DB:", error);
  }
}
