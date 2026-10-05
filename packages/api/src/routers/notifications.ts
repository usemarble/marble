import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  getNotificationPreferences,
  NotificationError,
  updateNotificationPreference,
} from "../services/notifications";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const preferencesOutput = z.object({
  user: z.object({ marketing: z.boolean(), product: z.boolean() }),
  workspace: z.object({ usageAlerts: z.boolean(), subscriptions: z.boolean() }),
});
const errorCodes = {
  400: "BAD_REQUEST",
  403: "FORBIDDEN",
  500: "INTERNAL_SERVER_ERROR",
} as const;

// Personal preferences live under /me, but the workspace ones belong to the
// caller's membership of one workspace, so these take `workspaceId` and use the
// workspace procedure's membership check.
const procedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof NotificationError) {
      throw new ORPCError(errorCodes[error.status], {
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
});

export const notificationsRouter = {
  get: procedure
    .route({
      method: "GET",
      path: "/me/notifications",
      tags: ["Me"],
      summary: "Get your notification preferences",
    })
    .input(workspaceInput)
    .output(preferencesOutput)
    .handler(({ context }) =>
      getNotificationPreferences(
        context,
        context.session.user.id,
        context.workspaceId
      )
    ),
  update: procedure
    .route({
      method: "PATCH",
      path: "/me/notifications",
      tags: ["Me"],
      summary: "Change one notification preference",
    })
    .input(
      workspaceInput.extend({
        scope: z.enum(["user", "workspace"]),
        key: z.string(),
        value: z.boolean(),
      })
    )
    .output(preferencesOutput)
    .handler(({ context, input }) =>
      updateNotificationPreference(
        context,
        context.session.user.id,
        context.workspaceId,
        input
      )
    ),
};
