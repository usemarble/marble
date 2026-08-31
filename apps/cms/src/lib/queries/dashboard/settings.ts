import "server-only";

import { db } from "@marble/drizzle";
import {
  apiKey,
  field,
  fieldOption,
  fieldValue,
  webhookEndpoint,
} from "@marble/drizzle/schema";
import { asc, count, desc, eq } from "drizzle-orm";
import type { APIKey } from "@/types/dashboard";
import type { CustomField } from "@/types/fields";
import type { WebhookListItem } from "@/types/webhook";
import type { ApiScope } from "@/utils/keys";

export async function getDashboardApiKeys(
  workspaceId: string
): Promise<APIKey[]> {
  const keys = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      preview: apiKey.preview,
      type: apiKey.type,
      scopes: apiKey.scopes,
      enabled: apiKey.enabled,
      requestCount: apiKey.requestCount,
      lastUsed: apiKey.lastUsed,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    })
    .from(apiKey)
    .where(eq(apiKey.workspaceId, workspaceId))
    .orderBy(desc(apiKey.createdAt));

  return keys.map((key) => ({
    ...key,
    type: key.type as APIKey["type"],
    scopes: key.scopes as ApiScope[],
  }));
}

export async function getDashboardWebhooks(
  workspaceId: string
): Promise<WebhookListItem[]> {
  const webhooks = await db
    .select({
      id: webhookEndpoint.id,
      name: webhookEndpoint.name,
      url: webhookEndpoint.url,
      events: webhookEndpoint.events,
      enabled: webhookEndpoint.enabled,
      format: webhookEndpoint.format,
      createdAt: webhookEndpoint.createdAt,
      updatedAt: webhookEndpoint.updatedAt,
    })
    .from(webhookEndpoint)
    .where(eq(webhookEndpoint.workspaceId, workspaceId))
    .orderBy(desc(webhookEndpoint.createdAt));

  return webhooks.map((webhook) => ({
    ...webhook,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  }));
}

export async function getDashboardCustomFields(
  workspaceId: string
): Promise<CustomField[]> {
  const [fields, valueCounts] = await Promise.all([
    db.query.field.findMany({
      where: eq(field.workspaceId, workspaceId),
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
      orderBy: [asc(field.position), asc(field.createdAt)],
    }),
    db
      .select({
        fieldId: fieldValue.fieldId,
        count: count(),
      })
      .from(fieldValue)
      .where(eq(fieldValue.workspaceId, workspaceId))
      .groupBy(fieldValue.fieldId),
  ]);

  const valueCountByFieldId = new Map(
    valueCounts.map((entry) => [entry.fieldId, entry.count])
  );

  return fields.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    key: entry.key,
    type: entry.type,
    required: entry.required,
    position: entry.position,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    options: entry.options.map((option) => ({
      ...option,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
    hasValues: (valueCountByFieldId.get(entry.id) ?? 0) > 0,
  }));
}
