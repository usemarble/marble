import { db } from "@marble/db";
import { buildWebhookPayload, serializeEventType } from "@marble/events";
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

type WebhookDeliveryCountArgs = NonNullable<
  Parameters<typeof db.webhookDelivery.count>[0]
>;

interface WebhookDeliveryWithRelations {
  id: string;
  eventId: string;
  workspaceId: string;
  webhookEndpointId: string;
  url: string;
  status: string;
  isTest: boolean;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  lastAttemptAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  event: Parameters<typeof buildWebhookPayload>[0] & {
    id: string;
    type: string;
    createdAt: Date;
  };
  attempts: Array<{
    id: string;
    attemptNumber: number;
    success: boolean;
    statusCode: number | null;
    responseBody: string | null;
    errorMessage: string | null;
    durationMs: number | null;
    createdAt: Date;
  }>;
}

function toPositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getResponseWhere(response: string | null) {
  if (!response || !VALID_RESPONSE_FILTERS.includes(response as never)) {
    return {};
  }

  if (response === "no_response") {
    return {
      attempts: {
        some: {
          statusCode: null,
        },
      },
    };
  }

  const start = Number.parseInt(response[0] ?? "0", 10) * 100;

  return {
    attempts: {
      some: {
        statusCode: {
          gte: start,
          lt: start + 100,
        },
      },
    },
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
  const response = searchParams.get("response");
  const search = searchParams.get("search")?.trim();

  const webhook = await db.webhookEndpoint.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const eventFilter =
    event && webhook.events.includes(event as WebhookEvent)
      ? { event: { type: event as WebhookEvent } }
      : {};

  const where: WebhookDeliveryCountArgs["where"] = {
    webhookEndpointId: id,
    workspaceId,
    ...(status && VALID_DELIVERY_STATUSES.includes(status as never)
      ? { status: status as never }
      : {}),
    ...eventFilter,
    ...getResponseWhere(response),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" as const } },
            { eventId: { contains: search, mode: "insensitive" as const } },
            {
              event: {
                id: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [totalCount, deliveries] = await Promise.all([
    db.webhookDelivery.count({ where }),
    db.webhookDelivery.findMany({
      where,
      include: {
        event: true,
        attempts: {
          orderBy: {
            attemptNumber: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * perPage,
      take: perPage,
    }) as unknown as Promise<WebhookDeliveryWithRelations[]>,
  ]);

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

  const existingWebhook = await db.webhookEndpoint.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  if (!existingWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const effectiveWebhook = webhookSchema.safeParse({
    name: body.data.name ?? existingWebhook.name,
    endpoint: body.data.endpoint ?? existingWebhook.url,
    events: body.data.events ?? existingWebhook.events,
    format: body.data.format ?? existingWebhook.format,
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
  } = {};

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

  const webhook = await db.webhookEndpoint.update({
    where: {
      id,
      workspaceId,
    },
    data: updateData,
  });

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

  const existingWebhook = await db.webhookEndpoint.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  if (!existingWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  await db.webhookEndpoint.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
