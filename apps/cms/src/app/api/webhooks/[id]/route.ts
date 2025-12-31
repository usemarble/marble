import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  type PayloadFormat,
  type WebhookEvent,
  webhookUpdateSchema,
} from "@/lib/validations/webhook";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = webhookUpdateSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  // Verify webhook exists and belongs to workspace
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  // Build update data conditionally, only including provided fields
  const updateData: {
    name?: string;
    endpoint?: string;
    events?: WebhookEvent[];
    format?: PayloadFormat;
    enabled?: boolean;
  } = {};

  if (body.data.name !== undefined) {
    updateData.name = body.data.name;
  }
  if (body.data.endpoint !== undefined) {
    updateData.endpoint = body.data.endpoint;
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

  const webhook = await db.webhook.update({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
    data: updateData,
  });

  return NextResponse.json(webhook, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }

  const { id } = await params;

  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const deletedWebhook = await db.webhook.delete({
    where: { id },
  });

  return NextResponse.json(deletedWebhook.id, { status: 204 });
}
