import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  type PayloadFormat,
  type WebhookEvent,
  webhookSchema,
  webhookUpdateSchema,
} from "@/lib/validations/webhook";

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
