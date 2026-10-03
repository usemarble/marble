import { z } from "zod";
import { protectedProcedure } from "../index";
import { listWorkspaces } from "../services/workspaces";

const planSchema = z.enum(["free", "hobby", "pro"]);

const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  timezone: z.string(),
  createdAt: z.date(),
  currentUserRole: z.string().nullable(),
  members: z.array(
    z.object({
      id: z.string(),
      role: z.string().nullable(),
      organizationId: z.string(),
      createdAt: z.date(),
      userId: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        image: z.string().nullable(),
      }),
    })
  ),
  invitations: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      role: z.string().nullable(),
      status: z.string(),
      organizationId: z.string(),
      inviterId: z.string(),
      expiresAt: z.date(),
    })
  ),
  subscription: z
    .object({
      id: z.string(),
      status: z.string(),
      plan: planSchema,
      activePlan: planSchema,
      currentPeriodStart: z.date(),
      currentPeriodEnd: z.date(),
      cancelAtPeriodEnd: z.boolean(),
      canceledAt: z.date().nullable(),
    })
    .nullable(),
});

export const workspacesRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/workspaces",
      tags: ["Workspaces"],
      summary: "List the workspaces you belong to",
    })
    .output(z.array(workspaceSchema))
    .handler(({ context }) => listWorkspaces(context, context.session.user.id)),
};
