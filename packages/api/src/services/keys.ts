import { createRecordId } from "@marble/db/id";
import { apiKey } from "@marble/db/schema";
import {
  API_KEY_PRIVATE_ONLY_SCOPES,
  DEFAULT_PRIVATE_API_KEY_SCOPES,
  DEFAULT_PUBLIC_API_KEY_SCOPES,
  generateApiKey,
} from "@marble/utils";
import { and, desc, eq } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { createApiKeySchema, updateApiKeySchema } from "../lib/key-validation";
import { transact } from "../lib/transaction";

export class ApiKeyError extends Error {
  readonly status: 400 | 404 | 500;
  readonly data?: Record<string, unknown>;
  constructor(
    status: 400 | 404 | 500,
    message: string,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
const listSelect = {
  id: apiKey.id,
  name: apiKey.name,
  preview: apiKey.preview,
  type: apiKey.type,
  scopes: apiKey.scopes,
  enabled: apiKey.enabled,
  requestCount: apiKey.requestCount,
  lastUsed: apiKey.lastUsed,
  expiresAt: apiKey.expiresAt,
  createdAt: apiKey.createdAt,
};
const createSelect = { ...listSelect, prefix: apiKey.prefix };
const detailSelect = {
  ...createSelect,
  updatedAt: apiKey.updatedAt,
  rateLimitTimeWindow: apiKey.rateLimitTimeWindow,
  rateLimitMax: apiKey.rateLimitMax,
  lastRequest: apiKey.lastRequest,
};

export function listApiKeys(ctx: ServiceContext, workspaceId: string) {
  return ctx.db
    .select(listSelect)
    .from(apiKey)
    .where(eq(apiKey.workspaceId, workspaceId))
    .orderBy(desc(apiKey.createdAt));
}
export async function getApiKey(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const [row] = await ctx.db
    .select(detailSelect)
    .from(apiKey)
    .where(and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)));
  if (!row) {
    throw new ApiKeyError(404, "API key not found");
  }
  return row;
}
function checkPublicScopes(type: string, scopes: string[]) {
  if (type !== "public") {
    return;
  }
  const forbiddenScopes = scopes.filter((scope) =>
    API_KEY_PRIVATE_ONLY_SCOPES.some((forbidden) => forbidden === scope)
  );
  if (forbiddenScopes.length) {
    throw new ApiKeyError(
      400,
      "Public API keys cannot include private-only scopes",
      { details: forbiddenScopes }
    );
  }
}
export async function createApiKey(
  ctx: ServiceContext,
  workspaceId: string,
  input: unknown
) {
  const parsed = createApiKeySchema.safeParse(input);
  if (!parsed.success) {
    throw new ApiKeyError(400, "Invalid request body", {
      details: parsed.error.issues,
    });
  }
  const body = parsed.data;
  const { key, hash, prefix, preview } = generateApiKey(body.type);
  const scopes =
    body.scopes ??
    (body.type === "public"
      ? [...DEFAULT_PUBLIC_API_KEY_SCOPES]
      : [...DEFAULT_PRIVATE_API_KEY_SCOPES]);
  checkPublicScopes(body.type, scopes);
  const created = await transact(ctx, async ({ tx }) => {
    const [row] = await tx
      .insert(apiKey)
      .values({
        id: createRecordId(),
        name: body.name,
        workspaceId,
        key: hash,
        prefix,
        preview,
        type: body.type,
        scopes,
        expiresAt: body.expiresAt ?? null,
        rateLimitTimeWindow: 86_400_000,
        rateLimitMax: 1000,
        updatedAt: new Date(),
      })
      .returning(createSelect);
    if (!row) {
      throw new ApiKeyError(500, "Failed to create API key");
    }
    return row;
  });
  return { ...created, key };
}
export async function updateApiKey(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  input: unknown
) {
  const parsed = updateApiKeySchema.safeParse(input);
  if (!parsed.success) {
    throw new ApiKeyError(400, "Invalid request body", {
      details: parsed.error.issues,
    });
  }
  const existing = await getApiKey(ctx, workspaceId, id);
  if (parsed.data.scopes !== undefined) {
    checkPublicScopes(existing.type, parsed.data.scopes);
  }
  return transact(ctx, async ({ tx }) => {
    const [row] = await tx
      .update(apiKey)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)))
      .returning(detailSelect);
    if (!row) {
      throw new ApiKeyError(404, "API key not found");
    }
    return row;
  });
}
export async function deleteApiKey(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  await getApiKey(ctx, workspaceId, id);
  try {
    await transact(ctx, ({ tx }) =>
      tx
        .delete(apiKey)
        .where(and(eq(apiKey.id, id), eq(apiKey.workspaceId, workspaceId)))
    );
  } catch {
    throw new ApiKeyError(500, "Failed to delete API key");
  }
}
