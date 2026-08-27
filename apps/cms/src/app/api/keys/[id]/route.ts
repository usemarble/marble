import { db } from "@marble/drizzle";
import { apiKey } from "@marble/drizzle/schema";
import { and, eq } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { updateApiKeySchema } from "@/lib/validations/keys";
import { type ApiScope, getPublicKeyForbiddenScopes } from "@/utils/keys";

const apiKeySelect = {
  id: apiKey.id,
  name: apiKey.name,
  prefix: apiKey.prefix,
  preview: apiKey.preview,
  type: apiKey.type,
  scopes: apiKey.scopes,
  requestCount: apiKey.requestCount,
  enabled: apiKey.enabled,
  lastUsed: apiKey.lastUsed,
  expiresAt: apiKey.expiresAt,
  createdAt: apiKey.createdAt,
  updatedAt: apiKey.updatedAt,
  rateLimitTimeWindow: apiKey.rateLimitTimeWindow,
  rateLimitMax: apiKey.rateLimitMax,
  lastRequest: apiKey.lastRequest,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const foundApiKey = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)),
    columns: {
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
      rateLimitTimeWindow: true,
      rateLimitMax: true,
      lastRequest: true,
    },
  });

  if (!foundApiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json(foundApiKey, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const json = await request.json();
  const body = updateApiKeySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const existingKey = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)),
  });

  if (!existingKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const updateData: {
    name?: string;
    scopes?: ApiScope[];
    expiresAt?: Date | null;
    enabled?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (body.data.name !== undefined) {
    updateData.name = body.data.name;
  }
  if (body.data.scopes !== undefined) {
    if (existingKey.type === "public") {
      const forbiddenScopes = getPublicKeyForbiddenScopes(body.data.scopes);
      if (forbiddenScopes.length > 0) {
        return NextResponse.json(
          {
            error: "Public API keys cannot include private-only scopes",
            details: forbiddenScopes,
          },
          { status: 400 }
        );
      }
    }
    updateData.scopes = body.data.scopes;
  }
  if (body.data.expiresAt !== undefined) {
    updateData.expiresAt = body.data.expiresAt;
  }
  if (body.data.enabled !== undefined) {
    updateData.enabled = body.data.enabled;
  }

  const [updatedKey] = await db
    .update(apiKey)
    .set(updateData)
    .where(and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)))
    .returning(apiKeySelect);

  if (!updatedKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json(updatedKey, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const foundApiKey = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)),
  });

  if (!foundApiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  try {
    await db
      .delete(apiKey)
      .where(and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)));

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
