import "server-only";

import { db } from "@marble/db";
import type { APIKey } from "@/types/dashboard";
import type { CustomField } from "@/types/fields";
import type { WebhookListItem } from "@/types/webhook";
import type { ApiScope } from "@/utils/keys";

export async function getDashboardApiKeys(
  workspaceId: string
): Promise<APIKey[]> {
  const keys = await db.apiKey.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      preview: true,
      type: true,
      scopes: true,
      enabled: true,
      requestCount: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return keys.map((key) => ({
    ...key,
    type: key.type as APIKey["type"],
    scopes: key.scopes as ApiScope[],
  }));
}

export async function getDashboardWebhooks(
  workspaceId: string
): Promise<WebhookListItem[]> {
  return db.webhookEndpoint.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      enabled: true,
      format: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDashboardCustomFields(
  workspaceId: string
): Promise<CustomField[]> {
  const fields = await db.field.findMany({
    where: {
      workspaceId,
    },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          values: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return fields.map(({ _count, ...field }) => ({
    ...field,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
    options: field.options.map((option) => ({
      ...option,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
    hasValues: _count.values > 0,
  }));
}
