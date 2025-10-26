import { randomBytes } from "node:crypto";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { webhookSchema } from "@/lib/validations/webhook";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await db.webhook.findMany({
    where: {
      workspaceId: sessionData.session.activeOrganizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(webhooks, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = webhookSchema.parse(json);

  const secret = randomBytes(32).toString("hex");

  const webhook = await db.webhook.create({
    data: {
      name: body.name,
      endpoint: body.endpoint,
      events: body.events,
      secret,
      format: body.format,
      workspaceId: sessionData.session.activeOrganizationId,
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}
