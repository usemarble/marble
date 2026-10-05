import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  aiReadabilityBodySchema,
  aiReadabilityResponseSchema,
} from "../lib/readability-validation";
import { ReadabilityError, suggestReadability } from "../services/readability";

const suggestionsInput = aiReadabilityBodySchema.extend({
  workspaceId: z.string().min(1),
  bypassCache: z.boolean().optional(),
});
const suggestionsOutput = aiReadabilityResponseSchema.extend({
  /** The model call failed, so there are no suggestions this time. */
  unavailable: z.boolean(),
});
const errorCodes = {
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "TOO_MANY_REQUESTS",
} as const;

export const aiRouter = {
  suggestions: workspaceProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/ai/suggestions",
      tags: ["AI"],
      summary: "Get AI readability suggestions for an editor draft",
    })
    .input(suggestionsInput)
    .output(suggestionsOutput)
    .handler(async ({ context, input }) => {
      const { workspaceId: _workspaceId, ...rest } = input;
      try {
        return await suggestReadability(context, {
          ...rest,
          workspaceId: context.workspaceId,
          userId: context.session.user.id,
          clientIp: context.clientIp,
        });
      } catch (error) {
        if (error instanceof ReadabilityError) {
          throw new ORPCError(errorCodes[error.status], {
            message: error.message,
            data: error.rateLimit,
            cause: error,
          });
        }
        throw error;
      }
    }),
};
