import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { updateApiKeySchema } from "@/lib/validations/keys";
import type { ApiScope } from "@/utils/keys";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = await db.apiKey.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      name: true,
      prefix: true,
      preview: true,
      type: true,
      scopes: true,
      requestCount: true,
      enabled: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json(apiKey, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const body = updateApiKeySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  // Verify the key exists and belongs to the workspace
  const existingKey = await db.apiKey.findFirst({
    where: { id, workspaceId },
  });

  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const updateData: {
    name?: string;
    scopes?: ApiScope[];
    expiresAt?: Date | null;
    enabled?: boolean;
  } = {};

  if (body.data.name !== undefined) {
    updateData.name = body.data.name;
  }
  if (body.data.scopes !== undefined) {
    updateData.scopes = body.data.scopes;
  }
  if (body.data.expiresAt !== undefined) {
    updateData.expiresAt = body.data.expiresAt;
  }
  if (body.data.enabled !== undefined) {
    updateData.enabled = body.data.enabled;
  }

  const updatedKey = await db.apiKey.update({
    where: {
      id,
      workspaceId,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      prefix: true,
      preview: true,
      type: true,
      scopes: true,
      requestCount: true,
      enabled: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updatedKey, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await db.apiKey.findFirst({
    where: { id, workspaceId },
  });

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  try {
    await db.apiKey.delete({
      where: {
        id,
        workspaceId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
