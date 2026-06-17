import { db } from "@marble/db";
import { generateApiKey } from "@marble/utils";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { getDashboardApiKeys } from "@/lib/queries/dashboard/settings";
import { createApiKeySchema } from "@/lib/validations/keys";
import {
  DEFAULT_PRIVATE_SCOPES,
  DEFAULT_PUBLIC_SCOPES,
  getPublicKeyWriteScopes,
} from "@/utils/keys";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  return NextResponse.json(await getDashboardApiKeys(workspaceId), {
    status: 200,
  });
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

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

  if (body.data.type === "public") {
    const writeScopes = getPublicKeyWriteScopes(scopesToSet);
    if (writeScopes.length > 0) {
      return NextResponse.json(
        {
          error: "Public API keys cannot include write scopes",
          details: writeScopes,
        },
        { status: 400 }
      );
    }
  }

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
      // Automatically set default rate limits: 1000 requests per 24 hours
      rateLimitTimeWindow: 86_400_000, // 24 hours in ms
      rateLimitMax: 1000,
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
