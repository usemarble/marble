import { randomBytes } from "node:crypto";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { webhookSchema } from "@/lib/validations/webhook";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const webhooks = await db.webhookEndpoint.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(webhooks, { status: 200 });
}

export async function POST(req: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const json = await req.json();
  const body = webhookSchema.parse(json);

  const secret = randomBytes(32).toString("hex");

  const webhook = await db.webhookEndpoint.create({
    data: {
      name: body.name,
      url: body.endpoint,
      events: body.events,
      secret,
      format: body.format,
      workspaceId,
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}
