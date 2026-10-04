import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import { BillingError, completeCheckout } from "../services/billing";

export const billingRouter = {
  completeCheckout: workspaceProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/billing/checkout-success",
      tags: ["Billing"],
      summary: "Refresh cached usage and plan after checkout",
    })
    .input(z.object({ workspaceId: z.string().min(1) }))
    .output(z.object({ slug: z.string() }))
    .handler(async ({ context }) => {
      try {
        return await completeCheckout(context, context.workspaceId);
      } catch (error) {
        if (error instanceof BillingError) {
          throw new ORPCError("NOT_FOUND", {
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
};
