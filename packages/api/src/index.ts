import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import type { Context } from "./context";
import { getMembership } from "./services/access";

export const o = os.$context<Context>();

export const publicProcedure = o;

/**
 * Requires a signed-in user with a verified email, which is all the dashboard
 * serves (an unverified user is sent to /verify before any of it loads).
 */
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const { session } = context;
    if (!session?.user.emailVerified) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { session } });
  }
);

const workspaceIdInput = z.object({ workspaceId: z.string().min(1) });

/**
 * For workspace-scoped procedures. Their input must include `workspaceId`, the
 * workspace's ID (not its slug, which can be renamed). It is checked against the
 * caller's membership for that workspace; the session's active organization is
 * never consulted, so two tabs on two workspaces can't act on each other.
 * Puts `{ workspaceId, role }` on the context.
 *
 * Middleware runs before the procedure's own input validation, so this reads
 * `workspaceId` itself: a non-member learns nothing about the rest of the
 * input's shape.
 */
export const workspaceProcedure = protectedProcedure.use(
  async ({ context, next }, input: unknown) => {
    const parsed = workspaceIdInput.safeParse(input);
    if (!parsed.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: "workspaceId is required",
      });
    }

    const { workspaceId } = parsed.data;
    const membership = await getMembership(
      context,
      workspaceId,
      context.session.user.id
    );
    if (!membership) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have access to this workspace",
      });
    }

    context.log.set({ workspace: { id: workspaceId, role: membership.role } });
    return next({ context: { workspaceId, role: membership.role } });
  }
);
