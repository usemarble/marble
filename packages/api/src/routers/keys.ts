import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  apiKeyTypeEnum,
  apiScopeEnum,
  createApiKeySchema,
  updateApiKeySchema,
} from "../lib/key-validation";
import {
  ApiKeyError,
  createApiKey,
  deleteApiKey,
  getApiKey,
  listApiKeys,
  updateApiKey,
} from "../services/keys";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const keyInput = workspaceInput.extend({ id: z.string() });
const listOutput = z.object({
  id: z.string(),
  name: z.string(),
  preview: z.string(),
  type: z.string().pipe(apiKeyTypeEnum),
  scopes: z.array(z.string().pipe(apiScopeEnum)),
  enabled: z.boolean(),
  requestCount: z.number(),
  lastUsed: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
});
const createOutput = listOutput.extend({ prefix: z.string().nullable() });
const detailOutput = createOutput.extend({
  updatedAt: z.date(),
  rateLimitTimeWindow: z.number().nullable(),
  rateLimitMax: z.number().nullable(),
  lastRequest: z.date().nullable(),
});
const errorCodes = {
  400: "BAD_REQUEST",
  404: "NOT_FOUND",
  500: "INTERNAL_SERVER_ERROR",
} as const;
const procedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ApiKeyError) {
      throw new ORPCError(errorCodes[error.status], {
        message: error.message,
        data: error.data,
        cause: error,
      });
    }
    if (
      error instanceof ORPCError &&
      error.code === "BAD_REQUEST" &&
      error.cause instanceof ValidationError
    ) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid request body",
        data: { details: error.cause.issues },
        cause: error,
      });
    }
    throw error;
  }
});
export const keysRouter = {
  list: procedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/keys",
      tags: ["API keys"],
    })
    .input(workspaceInput)
    .output(z.array(listOutput))
    .handler(({ context }) => listApiKeys(context, context.workspaceId)),
  get: procedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/keys/{id}",
      tags: ["API keys"],
    })
    .input(keyInput)
    .output(detailOutput)
    .handler(({ context, input }) =>
      getApiKey(context, context.workspaceId, input.id)
    ),
  create: procedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/keys",
      tags: ["API keys"],
    })
    .input(createApiKeySchema.extend(workspaceInput.shape))
    .output(createOutput.extend({ key: z.string() }))
    .handler(({ context, input }) =>
      createApiKey(context, context.workspaceId, input)
    ),
  update: procedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/keys/{id}",
      tags: ["API keys"],
    })
    .input(updateApiKeySchema.extend(keyInput.shape))
    .output(detailOutput)
    .handler(({ context, input }) =>
      updateApiKey(context, context.workspaceId, input.id, input)
    ),
  delete: procedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/keys/{id}",
      tags: ["API keys"],
    })
    .input(keyInput)
    .output(z.void())
    .handler(({ context, input }) =>
      deleteApiKey(context, context.workspaceId, input.id)
    ),
};
