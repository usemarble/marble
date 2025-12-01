import { db } from "@marble/db";
import { generateApiKey } from "@marble/utils";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { createApiKeySchema } from "@/lib/validations/keys";
import { DEFAULT_PRIVATE_SCOPES, DEFAULT_PUBLIC_SCOPES } from "@/utils/keys";

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
      preview: true,
      type: true,
      scopes: true,
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

  const { key, hash, prefix, preview } = generateApiKey(body.data.type);

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
      key: hash,
      prefix,
      preview,
      type: body.data.type,
      scopes: scopesToSet,
      expiresAt: body.data.expiresAt ?? null,
      // Default rate limits: 1000 requests per 24 hours
      rateLimitTimeWindow: body.data.rateLimitTimeWindow ?? 86_400_000, // 24 hours in ms
      rateLimitMax: body.data.rateLimitMax ?? 1000,
    },
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
  });

  // Return with plaintext key (only time it's visible)
  return NextResponse.json({ ...apiKey, key }, { status: 201 });
}
