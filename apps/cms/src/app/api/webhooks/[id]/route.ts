import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { webhookToggleSchema } from "@/lib/validations/webhook";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
  //   for now im only allowing updates to the toggle state
  const body = webhookToggleSchema.parse(json);

  const webhook = await db.webhook.update({
    where: {
      id: id,
      workspaceId: session.session.activeOrganizationId,
    },
    data: { ...body },
  });

  return NextResponse.json(webhook, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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
      id: id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingWebhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const deletedWebhook = await db.webhook.delete({
    where: { id: id },
  });

  return NextResponse.json(deletedWebhook.id, { status: 204 });
}
