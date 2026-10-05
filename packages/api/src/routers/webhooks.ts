import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  payloadFormatEnum,
  webhookEventEnum,
  webhookSchema,
  webhookUpdateSchema,
} from "../lib/webhook-validation";
import {
  createWebhook,
  deleteWebhook,
  getWebhook,
  listWebhooks,
  testWebhook,
  updateWebhook,
  WebhookError,
} from "../services/webhooks";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const webhookInput = workspaceInput.extend({ id: z.string() });
const webhookOutput = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  events: z.array(webhookEventEnum.or(z.literal("post_created"))),
  enabled: z.boolean(),
  format: payloadFormatEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});
const detailWebhookOutput = webhookOutput.extend({ secret: z.string() });
const attemptOutput = z.object({
  id: z.string(),
  attemptNumber: z.number(),
  success: z.boolean(),
  statusCode: z.number().nullable(),
  responseBody: z.string().nullable(),
  errorMessage: z.string().nullable(),
  durationMs: z.number().nullable(),
  createdAt: z.string(),
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
    if (error instanceof WebhookError) {
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
export const webhooksRouter = {
  list: procedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/webhooks",
      tags: ["Webhooks"],
    })
    .input(workspaceInput)
    .output(z.array(webhookOutput))
    .handler(({ context }) => listWebhooks(context, context.workspaceId)),
  get: procedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/webhooks/{id}",
      tags: ["Webhooks"],
    })
    .input(
      webhookInput.extend({
        page: z.number().optional(),
        perPage: z.number().optional(),
        status: z.string().optional(),
        event: z.string().optional(),
        search: z.string().optional(),
        response: z.string().optional(),
      })
    )
    .output(
      z.object({
        webhook: detailWebhookOutput,
        pageCount: z.number(),
        totalCount: z.number(),
        deliveries: z.array(
          z.object({
            id: z.string(),
            eventId: z.string(),
            eventType: z.string(),
            eventCreatedAt: z.string(),
            status: z.string(),
            url: z.string(),
            isTest: z.boolean(),
            attemptCount: z.number(),
            maxAttempts: z.number(),
            createdAt: z.string(),
            updatedAt: z.string(),
            lastAttemptAt: z.string().nullable(),
            deliveredAt: z.string().nullable(),
            failedAt: z.string().nullable(),
            payload: z.unknown(),
            latestAttempt: attemptOutput.nullable(),
            attempts: z.array(attemptOutput),
          })
        ),
      })
    )
    .handler(({ context, input }) =>
      getWebhook(context, context.workspaceId, input.id, input)
    ),
  create: procedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/webhooks",
      tags: ["Webhooks"],
    })
    .input(webhookSchema.safeExtend(workspaceInput.shape))
    .output(detailWebhookOutput)
    .handler(({ context, input }) =>
      createWebhook(context, context.workspaceId, input)
    ),
  update: procedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/webhooks/{id}",
      tags: ["Webhooks"],
    })
    .input(webhookUpdateSchema.safeExtend(webhookInput.shape))
    .output(detailWebhookOutput)
    .handler(({ context, input }) =>
      updateWebhook(context, context.workspaceId, input.id, input)
    ),
  delete: procedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/webhooks/{id}",
      tags: ["Webhooks"],
    })
    .input(webhookInput)
    .output(z.void())
    .handler(({ context, input }) =>
      deleteWebhook(context, context.workspaceId, input.id)
    ),
  test: procedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/webhooks/{id}/test",
      tags: ["Webhooks"],
    })
    .input(webhookInput)
    .output(z.object({ ok: z.boolean(), eventId: z.string() }))
    .handler(({ context, input }) =>
      testWebhook(
        context,
        context.workspaceId,
        input.id,
        context.session.user.id
      )
    ),
};
