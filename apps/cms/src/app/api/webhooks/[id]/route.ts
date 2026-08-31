import { db } from "@marble/drizzle";
import {
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspaceEvent,
} from "@marble/drizzle/schema";
import { buildWebhookPayload, serializeEventType } from "@marble/events";
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
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  type PayloadFormat,
  type WebhookEvent,
  webhookSchema,
  webhookUpdateSchema,
} from "@/lib/validations/webhook";
import { buildWebhookRequestBody } from "@/lib/webhooks/payload";

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
    conditions.push(
      or(
        ilike(webhookDelivery.id, `%${search}%`),
        ilike(webhookDelivery.eventId, `%${search}%`),
        ilike(workspaceEvent.id, `%${search}%`)
      )!
    );
  } else if (search) {
    conditions.push(
      or(
        ilike(webhookDelivery.id, `%${search}%`),
        ilike(webhookDelivery.eventId, `%${search}%`)
      )!
    );
  }

  return and(...conditions);
}

async function fetchDeliveriesWithRelations(deliveryIds: string[]) {
  if (deliveryIds.length === 0) {
    return [];
  }

  const deliveries = await db.query.webhookDelivery.findMany({
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
      db
        .select({ count: count() })
        .from(webhookDelivery)
        .innerJoin(
          workspaceEvent,
          eq(webhookDelivery.eventId, workspaceEvent.id)
        )
        .where(where),
      db
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
      idRows.map((row) => row.id)
    );

    return {
      totalCount: countRow[0]?.count ?? 0,
      deliveries,
    };
  }

  const [countRow, idRows] = await Promise.all([
    db.select({ count: count() }).from(webhookDelivery).where(where),
    db
      .select({ id: webhookDelivery.id })
      .from(webhookDelivery)
      .where(where)
      .orderBy(desc(webhookDelivery.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const deliveries = await fetchDeliveriesWithRelations(
    idRows.map((row) => row.id)
  );

  return {
    totalCount: countRow[0]?.count ?? 0,
    deliveries,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const page = toPositiveInteger(searchParams.get("page"), 1);
  const perPage = Math.min(
    toPositiveInteger(searchParams.get("perPage"), 20),
    100
  );
  const status = searchParams.get("status");
  const event = searchParams.get("event");
  const responseFilter = getResponseFilter(searchParams.get("response"));
  const search = searchParams.get("search")?.trim();

  const webhook = await db.query.webhookEndpoint.findFirst({
    where: and(
      eq(webhookEndpoint.id, id),
      eq(webhookEndpoint.workspaceId, workspaceId)
    ),
  });

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const eventType =
    event && webhook.events.includes(event as WebhookEvent)
      ? (event as WebhookEvent)
      : null;

  const result = await listDeliveries(
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

  return NextResponse.json(
    {
      webhook,
      deliveries: deliveries.map((delivery) => {
        const payload = buildWebhookPayload(delivery.event);
        const requestBody = buildWebhookRequestBody(
          payload,
          webhook.format as PayloadFormat
        );
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
    },
    { status: 200 }
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const { id } = await params;

  const json = await req.json();
  const body = webhookUpdateSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const foundWebhook = await db.query.webhookEndpoint.findFirst({
    where: and(
      eq(webhookEndpoint.id, id),
      eq(webhookEndpoint.workspaceId, workspaceId)
    ),
  });

  if (!foundWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const effectiveWebhook = webhookSchema.safeParse({
    name: body.data.name ?? foundWebhook.name,
    endpoint: body.data.endpoint ?? foundWebhook.url,
    events: body.data.events ?? foundWebhook.events,
    format: body.data.format ?? foundWebhook.format,
  });

  if (!effectiveWebhook.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: effectiveWebhook.error.issues,
      },
      { status: 400 }
    );
  }

  const updateData: {
    name?: string;
    url?: string;
    events?: WebhookEvent[];
    format?: PayloadFormat;
    enabled?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (body.data.name !== undefined) {
    updateData.name = body.data.name;
  }
  if (body.data.endpoint !== undefined) {
    updateData.url = body.data.endpoint;
  }
  if (body.data.events !== undefined) {
    updateData.events = body.data.events;
  }
  if (body.data.format !== undefined) {
    updateData.format = body.data.format;
  }
  if (body.data.enabled !== undefined) {
    updateData.enabled = body.data.enabled;
  }

  const [webhook] = await db
    .update(webhookEndpoint)
    .set(updateData)
    .where(
      and(
        eq(webhookEndpoint.id, id),
        eq(webhookEndpoint.workspaceId, workspaceId)
      )
    )
    .returning();

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json(webhook, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const { id } = await params;

  const foundWebhook = await db.query.webhookEndpoint.findFirst({
    where: and(
      eq(webhookEndpoint.id, id),
      eq(webhookEndpoint.workspaceId, workspaceId)
    ),
  });

  if (!foundWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  await db.delete(webhookEndpoint).where(eq(webhookEndpoint.id, id));

  return new NextResponse(null, { status: 204 });
}
