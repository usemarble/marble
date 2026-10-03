import { z } from "zod";
import { protectedProcedure, workspaceProcedure } from "../index";
import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
  listWorkspaces,
} from "../services/workspaces";

const planSchema = z.enum(["free", "hobby", "pro"]);
const workspaceInput = z.object({ workspaceId: z.string().min(1) });

const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  timezone: z.string(),
  currentUserRole: z.string().nullable(),
  memberCount: z.number(),
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

const memberSchema = z.object({
  id: z.string(),
  role: z.string().nullable(),
  createdAt: z.date(),
  userId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.string(),
  inviterId: z.string(),
  expiresAt: z.date(),
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
  members: {
    list: workspaceProcedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/members",
        tags: ["Workspaces"],
        summary: "List a workspace's members",
      })
      .input(workspaceInput)
      .output(z.array(memberSchema))
      .handler(({ context }) =>
        listWorkspaceMembers(context, context.workspaceId)
      ),
  },
  invitations: {
    list: workspaceProcedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/invitations",
        tags: ["Workspaces"],
        summary: "List a workspace's invitations",
      })
      .input(workspaceInput)
      .output(z.array(invitationSchema))
      .handler(({ context }) =>
        listWorkspaceInvitations(context, context.workspaceId)
      ),
  },
};
