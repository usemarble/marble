import { db } from "@marble/drizzle";
import { apiKey } from "@marble/drizzle/schema";
import { generateApiKey } from "@marble/utils";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { getDashboardApiKeys } from "@/lib/queries/dashboard/settings";
import { createApiKeySchema } from "@/lib/validations/keys";
import {
  DEFAULT_PRIVATE_SCOPES,
  DEFAULT_PUBLIC_SCOPES,
  getPublicKeyForbiddenScopes,
} from "@/utils/keys";

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
} as const;

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

  const scopesToSet =
    body.data.scopes ??
    (body.data.type === "public"
      ? [...DEFAULT_PUBLIC_SCOPES]
      : [...DEFAULT_PRIVATE_SCOPES]);

  if (body.data.type === "public") {
    const forbiddenScopes = getPublicKeyForbiddenScopes(scopesToSet);
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

  const now = new Date();

  const [createdApiKey] = await db
    .insert(apiKey)
    .values({
      id: createId(),
      name: body.data.name,
      workspaceId,
      key: hash,
      prefix,
      preview,
      type: body.data.type,
      scopes: scopesToSet,
      expiresAt: body.data.expiresAt ?? null,
      rateLimitTimeWindow: 86_400_000,
      rateLimitMax: 1000,
      updatedAt: now,
    })
    .returning(apiKeySelect);

  if (!createdApiKey) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...createdApiKey, key }, { status: 201 });
}
