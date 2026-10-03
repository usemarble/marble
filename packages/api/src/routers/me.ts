import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { getProfile, ProfileError, updateProfile } from "../services/profile";
import { accountsRouter } from "./accounts";
import { notificationsRouter } from "./notifications";

const profileOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
const errorCodes = {
  401: "UNAUTHORIZED",
  500: "INTERNAL_SERVER_ERROR",
} as const;

const procedure = protectedProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ProfileError) {
      throw new ORPCError(errorCodes[error.status], {
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
});

export const meRouter = {
  get: procedure
    .route({
      method: "GET",
      path: "/me",
      tags: ["Me"],
      summary: "Get the signed-in user",
    })
    .output(profileOutput)
    .handler(({ context }) => getProfile(context, context.session.user.id)),
  update: procedure
    .route({
      method: "PATCH",
      path: "/me",
      tags: ["Me"],
      summary: "Update the signed-in user's name or avatar",
    })
    .input(
      z.object({ name: z.string().optional(), image: z.string().optional() })
    )
    .output(profileOutput)
    .handler(({ context, input }) =>
      updateProfile(context, context.session.user.id, input)
    ),
  notifications: notificationsRouter,
  accounts: accountsRouter,
};
