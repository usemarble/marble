import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  AccountError,
  deleteAccount,
  listAccounts,
} from "../services/accounts";

const procedure = protectedProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof AccountError) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
});

export const accountsRouter = {
  list: procedure
    .route({
      method: "GET",
      path: "/me/accounts",
      tags: ["Me"],
      summary: "List your linked sign-in accounts",
    })
    .output(
      z.array(
        z.object({
          id: z.string(),
          createdAt: z.date(),
          providerId: z.string(),
          accountId: z.string(),
          email: z.string(),
        })
      )
    )
    .handler(({ context }) => listAccounts(context, context.session.user.id)),
  delete: procedure
    .route({
      method: "DELETE",
      path: "/me/accounts/{id}",
      tags: ["Me"],
      summary: "Unlink one of your accounts",
    })
    .input(z.object({ id: z.string() }))
    .output(z.void())
    .handler(({ context, input }) =>
      deleteAccount(context, context.session.user.id, input.id)
    ),
};
