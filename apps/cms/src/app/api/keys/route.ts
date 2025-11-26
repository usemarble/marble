import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { createApiKeySchema } from "@/lib/validations/keys";
import { DEFAULT_PRIVATE_SCOPES, DEFAULT_PUBLIC_SCOPES } from "@/utils/keys";
import { generateApiKey } from "@/utils/string";

export async function GET() {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const keys = await db.apiKey.findMany({
    where: { workspaceId },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(keys, { status: 200 });
}

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const body = createApiKeySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const { key, prefix, preview } = generateApiKey(body.data.type);

  // Set default scopes based on type if not provided
  const scopesToSet =
    body.data.scopes ??
    (body.data.type === "public"
      ? [...DEFAULT_PUBLIC_SCOPES]
      : [...DEFAULT_PRIVATE_SCOPES]);

  const apiKey = await db.apiKey.create({
    data: {
      name: body.data.name,
      workspaceId,
      key,
      prefix,
      preview,
      type: body.data.type,
      scopes: scopesToSet,
      expiresAt: body.data.expiresAt ?? null,
    },
    select: {
      id: true,
      name: true,
      key: true,
      prefix: true,
      preview: true,
      type: true,
      scopes: true,
      requestCount: true,
      enabled: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(apiKey, { status: 201 });
}
