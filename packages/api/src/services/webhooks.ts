import { randomBytes } from "node:crypto";
import { createRecordId } from "@marble/db/id";
import {
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspaceEvent,
} from "@marble/db/schema";
import {
  buildWebhookPayload,
  getDemoPostPublishedPayload,
  serializeEventType,
} from "@marble/events";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";
import { buildWebhookRequestBody } from "../lib/webhook-payload";
import {
  type WebhookEvent,
  webhookSchema,
  webhookUpdateSchema,
} from "../lib/webhook-validation";

export class WebhookError extends Error {
  readonly status: 400 | 404 | 500;
  readonly data?: Record<string, unknown>;
  constructor(
    status: 400 | 404 | 500,
    message: string,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function webhookDto(row: typeof webhookEndpoint.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    events: row.events,
    enabled: row.enabled,
    format: row.format,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    secret: row.secret,
  };
}

export async function listWebhooks(ctx: ServiceContext, workspaceId: string) {
  const rows = await ctx.db
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
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  input: unknown
) {
  const parsed = webhookSchema.safeParse(input);
  if (!parsed.success) {
    throw new WebhookError(400, "Invalid request body", {
      details: parsed.error.issues,
    });
  }
  const body = parsed.data;
  return transact(ctx, async ({ tx }) => {
    const [row] = await tx
      .insert(webhookEndpoint)
      .values({
        id: createRecordId(),
        name: body.name,
        url: body.endpoint,
        events: body.events,
        secret: randomBytes(32).toString("hex"),
        format: body.format,
        workspaceId,
        updatedAt: new Date(),
      })
      .returning();
    if (!row) {
      throw new WebhookError(500, "Failed to create webhook");
    }
    return webhookDto(row);
  });
}

async function requireWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const row = await ctx.db.query.webhookEndpoint.findFirst({
    where: and(
      eq(webhookEndpoint.id, id),
      eq(webhookEndpoint.workspaceId, workspaceId)
    ),
  });
  if (!row) {
    throw new WebhookError(404, "Webhook not found");
  }
  return row;
}

export async function updateWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  input: unknown
) {
  const body = webhookUpdateSchema.safeParse(input);
  if (!body.success) {
    throw new WebhookError(400, "Invalid request body", {
      details: body.error.issues,
    });
  }
  const foundWebhook = await requireWebhook(ctx, workspaceId, id);
  const effectiveWebhook = webhookSchema.safeParse({
    name: body.data.name ?? foundWebhook.name,
    endpoint: body.data.endpoint ?? foundWebhook.url,
    events: body.data.events ?? foundWebhook.events,
    format: body.data.format ?? foundWebhook.format,
  });
  if (!effectiveWebhook.success) {
    throw new WebhookError(400, "Invalid request body", {
      details: effectiveWebhook.error.issues,
    });
  }
  const { endpoint, ...values } = body.data;
  return transact(ctx, async ({ tx }) => {
    const [row] = await tx
      .update(webhookEndpoint)
      .set({
        ...values,
        ...(endpoint !== undefined && { url: endpoint }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(webhookEndpoint.id, id),
          eq(webhookEndpoint.workspaceId, workspaceId)
        )
      )
      .returning();
    if (!row) {
      throw new WebhookError(404, "Webhook not found");
    }
    return webhookDto(row);
  });
}

export async function deleteWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  await requireWebhook(ctx, workspaceId, id);
  return transact(ctx, async ({ tx }) => {
    await tx
      .delete(webhookEndpoint)
      .where(
        and(
          eq(webhookEndpoint.id, id),
          eq(webhookEndpoint.workspaceId, workspaceId)
        )
      );
  });
}

export async function testWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actorId: string
) {
  await requireWebhook(ctx, workspaceId, id);
  try {
    const event = await transact(ctx, ({ emitEvent }) =>
      emitEvent({
        type: "post_published",
        workspaceId,
        source: "dashboard",
        resourceType: "post",
        resourceId: "test",
        actorType: "user",
        actorId,
        payload: getDemoPostPublishedPayload(),
        testWebhookEndpointId: id,
      })
    );
    return { ok: true, eventId: event.id };
  } catch (error) {
    throw new WebhookError(500, "Failed to create event", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const VALID_DELIVERY_STATUSES = [
  "pending",
  "sending",
  "success",
  "retrying",
  "failed",
] as const;

const VALID_RESPONSE_FILTERS = [
  "2xx",
  "3xx",
  "4xx",
  "5xx",
  "no_response",
] as const;

type ResponseFilter = (typeof VALID_RESPONSE_FILTERS)[number];

function toPositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getResponseFilter(response: string | null): ResponseFilter | null {
  return response && VALID_RESPONSE_FILTERS.includes(response as ResponseFilter)
    ? (response as ResponseFilter)
    : null;
}

function latestAttemptStatusCodeSql() {
  return sql`(
    SELECT ${webhookDeliveryAttempt.statusCode}
    FROM ${webhookDeliveryAttempt}
    WHERE ${webhookDeliveryAttempt.deliveryId} = ${webhookDelivery.id}
    ORDER BY ${webhookDeliveryAttempt.attemptNumber} DESC
    LIMIT 1
  )`;
}

function buildLatestAttemptResponseCondition(
  responseFilter: ResponseFilter
): SQL {
  const latestStatusCode = latestAttemptStatusCodeSql();

  if (responseFilter === "no_response") {
    return sql`${latestStatusCode} IS NULL`;
  }

  const start = Number.parseInt(responseFilter.at(0) ?? "0", 10) * 100;
  return sql`${latestStatusCode} >= ${start} AND ${latestStatusCode} < ${start + 100}`;
}

function buildDeliveryConditions(
  webhookEndpointId: string,
  workspaceId: string,
  status: string | null,
  eventType: WebhookEvent | null,
  search: string | undefined,
  joinEvent: boolean
): SQL | undefined {
  const conditions: SQL[] = [
    eq(webhookDelivery.webhookEndpointId, webhookEndpointId),
    eq(webhookDelivery.workspaceId, workspaceId),
  ];

  if (
    status &&
    VALID_DELIVERY_STATUSES.includes(
      status as (typeof VALID_DELIVERY_STATUSES)[number]
    )
  ) {
    conditions.push(
      eq(
        webhookDelivery.status,
        status as (typeof VALID_DELIVERY_STATUSES)[number]
      )
    );
  }

  if (joinEvent && eventType) {
    conditions.push(eq(workspaceEvent.type, eventType));
  }

  if (joinEvent && search) {
    const searchCondition = or(
      ilike(webhookDelivery.id, `%${search}%`),
      ilike(webhookDelivery.eventId, `%${search}%`),
      ilike(workspaceEvent.id, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  } else if (search) {
    const searchCondition = or(
      ilike(webhookDelivery.id, `%${search}%`),
      ilike(webhookDelivery.eventId, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return and(...conditions);
}

async function fetchDeliveriesWithRelations(
  ctx: ServiceContext,
  deliveryIds: string[]
) {
  if (deliveryIds.length === 0) {
    return [];
  }

  const deliveries = await ctx.db.query.webhookDelivery.findMany({
    where: inArray(webhookDelivery.id, deliveryIds),
    with: {
      event: true,
      attempts: {
        orderBy: desc(webhookDeliveryAttempt.attemptNumber),
      },
    },
  });

  const deliveryMap = new Map(
    deliveries.map((delivery) => [delivery.id, delivery])
  );

  return deliveryIds.flatMap((deliveryId) => {
    const delivery = deliveryMap.get(deliveryId);
    return delivery ? [delivery] : [];
  });
}

async function listDeliveries(
  ctx: ServiceContext,
  webhookEndpointId: string,
  workspaceId: string,
  status: string | null,
  eventType: WebhookEvent | null,
  search: string | undefined,
  page: number,
  perPage: number,
  responseFilter: ResponseFilter | null = null
) {
  const joinEvent = Boolean(eventType || search);

  const baseWhere = buildDeliveryConditions(
    webhookEndpointId,
    workspaceId,
    status,
    eventType,
    search,
    joinEvent
  );

  const where = responseFilter
    ? and(baseWhere, buildLatestAttemptResponseCondition(responseFilter))
    : baseWhere;

  if (joinEvent) {
    const [countRow, idRows] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(webhookDelivery)
        .innerJoin(
          workspaceEvent,
          eq(webhookDelivery.eventId, workspaceEvent.id)
        )
        .where(where),
      ctx.db
        .select({ id: webhookDelivery.id })
        .from(webhookDelivery)
        .innerJoin(
          workspaceEvent,
          eq(webhookDelivery.eventId, workspaceEvent.id)
        )
        .where(where)
        .orderBy(desc(webhookDelivery.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
    ]);

    const deliveries = await fetchDeliveriesWithRelations(
      ctx,
      idRows.map((row) => row.id)
    );

    return {
      totalCount: countRow[0]?.count ?? 0,
      deliveries,
    };
  }

  const [countRow, idRows] = await Promise.all([
    ctx.db.select({ count: count() }).from(webhookDelivery).where(where),
    ctx.db
      .select({ id: webhookDelivery.id })
      .from(webhookDelivery)
      .where(where)
      .orderBy(desc(webhookDelivery.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const deliveries = await fetchDeliveriesWithRelations(
    ctx,
    idRows.map((row) => row.id)
  );

  return {
    totalCount: countRow[0]?.count ?? 0,
    deliveries,
  };
}

export async function getWebhook(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  input: {
    page?: number;
    perPage?: number;
    status?: string;
    event?: string;
    response?: string;
    search?: string;
  }
) {
  const filters = new URLSearchParams(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
  const page = toPositiveInteger(filters.get("page"), 1);
  const perPage = Math.min(toPositiveInteger(filters.get("perPage"), 20), 100);
  const status = filters.get("status");
  const event = filters.get("event");
  const responseFilter = getResponseFilter(filters.get("response"));
  const search = filters.get("search")?.trim();

  const webhook = await ctx.db.query.webhookEndpoint.findFirst({
    where: and(
      eq(webhookEndpoint.id, id),
      eq(webhookEndpoint.workspaceId, workspaceId)
    ),
  });

  if (!webhook) {
    throw new WebhookError(404, "Webhook not found");
  }

  const eventType =
    event && webhook.events.includes(event as WebhookEvent)
      ? (event as WebhookEvent)
      : null;

  const result = await listDeliveries(
    ctx,
    id,
    workspaceId,
    status,
    eventType,
    search,
    page,
    perPage,
    responseFilter
  );
  const totalCount = result.totalCount;
  const deliveries = result.deliveries;

  const pageCount = Math.max(1, Math.ceil(totalCount / perPage));

  return {
    webhook: webhookDto(webhook),
    deliveries: deliveries.map((delivery) => {
      const payload = buildWebhookPayload(delivery.event);
      const requestBody = buildWebhookRequestBody(payload, webhook.format);
      const latestAttempt = delivery.attempts[0] ?? null;

      return {
        id: delivery.id,
        eventId: delivery.eventId,
        eventType: serializeEventType(delivery.event.type),
        eventCreatedAt: delivery.event.createdAt.toISOString(),
        status: delivery.status,
        url: delivery.url,
        isTest: delivery.isTest,
        attemptCount: delivery.attemptCount,
        maxAttempts: delivery.maxAttempts,
        createdAt: delivery.createdAt.toISOString(),
        updatedAt: delivery.updatedAt.toISOString(),
        lastAttemptAt: delivery.lastAttemptAt?.toISOString() ?? null,
        deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
        failedAt: delivery.failedAt?.toISOString() ?? null,
        payload: requestBody,
        latestAttempt: latestAttempt
          ? {
              id: latestAttempt.id,
              attemptNumber: latestAttempt.attemptNumber,
              success: latestAttempt.success,
              statusCode: latestAttempt.statusCode,
              responseBody: latestAttempt.responseBody,
              errorMessage: latestAttempt.errorMessage,
              durationMs: latestAttempt.durationMs,
              createdAt: latestAttempt.createdAt.toISOString(),
            }
          : null,
        attempts: delivery.attempts.map((attempt) => ({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          success: attempt.success,
          statusCode: attempt.statusCode,
          responseBody: attempt.responseBody,
          errorMessage: attempt.errorMessage,
          durationMs: attempt.durationMs,
          createdAt: attempt.createdAt.toISOString(),
        })),
      };
    }),
    pageCount,
    totalCount,
  };
}
