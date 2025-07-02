"use server";

import { db } from "@marble/db";
import { revalidatePath } from "next/cache";
import { generateWebhookSecret } from "@/utils/string";
import getServerSession from "../auth/session";
import { type WebhookFormValues, webhookSchema } from "../validations/webhook";

/**
 * Create a new webhook
 */
export const createWebhookAction = async (values: WebhookFormValues) => {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.session.activeOrganizationId) {
    throw new Error("No active workspace");
  }

  const parsedValues = webhookSchema.parse(values);

  // If no secret provided, generate one
  const secret = parsedValues.secret || generateWebhookSecret();

  const webhook = await db.webhook.create({
    data: {
      name: parsedValues.name,
      endpoint: parsedValues.endpoint,
      events: parsedValues.events,
      secret,
      format: parsedValues.format,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  revalidatePath(`/${session.session.activeOrganizationId}/webhooks`);

  return { success: true, webhook };
};

/**
 * Update an existing webhook
 */
export const updateWebhookAction = async (
  id: string,
  values: WebhookFormValues,
) => {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.session.activeOrganizationId) {
    throw new Error("No active workspace");
  }

  const parsedValues = webhookSchema.parse(values);

  // Verify webhook belongs to user's workspace
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    throw new Error("Webhook not found");
  }

  const webhook = await db.webhook.update({
    where: { id },
    data: {
      name: parsedValues.name,
      endpoint: parsedValues.endpoint,
      events: parsedValues.events,
      secret: parsedValues.secret || existingWebhook.secret,
      format: parsedValues.format,
    },
  });

  revalidatePath(`/${session.session.activeOrganizationId}/webhooks`);

  return { success: true, webhook };
};

/**
 * Delete a webhook
 */
export const deleteWebhookAction = async (id: string) => {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.session.activeOrganizationId) {
    throw new Error("No active workspace");
  }

  // Verify webhook belongs to user's workspace
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    throw new Error("Webhook not found");
  }

  await db.webhook.delete({
    where: { id },
  });

  revalidatePath(`/${session.session.activeOrganizationId}/webhooks`);

  return { success: true };
};

/**
 * Toggle webhook enabled status
 */
export const toggleWebhookAction = async (id: string, enabled: boolean) => {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.session.activeOrganizationId) {
    throw new Error("No active workspace");
  }

  // Verify webhook belongs to user's workspace
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    throw new Error("Webhook not found");
  }

  const webhook = await db.webhook.update({
    where: { id },
    data: { enabled },
  });

  revalidatePath(`/${session.session.activeOrganizationId}/webhooks`);

  return { success: true, webhook };
};
