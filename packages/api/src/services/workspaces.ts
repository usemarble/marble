import type { DbClient } from "@marble/db";
import { invitation, member, subscription, workspace } from "@marble/db/schema";
import { getWorkspacePlan } from "@marble/utils";
import { and, asc, count, desc, eq, gt, inArray, or } from "drizzle-orm";

/** Subscriptions that still entitle a workspace to a paid plan. */
function activeSubscriptionFilter() {
  return or(
    eq(subscription.status, "active"),
    eq(subscription.status, "trialing"),
    and(
      eq(subscription.status, "canceled"),
      eq(subscription.cancelAtPeriodEnd, true),
      gt(subscription.currentPeriodEnd, new Date())
    )
  );
}

/**
 * Every workspace the user belongs to, newest first. This is what the
 * switcher, the workspace provider and the plan hooks read, so it carries the
 * caller's role and a member count rather than every member and invitation;
 * those are `listWorkspaceMembers` and `listWorkspaceInvitations`.
 */
export async function listWorkspaces(ctx: { db: DbClient }, userId: string) {
  const memberships = await ctx.db
    .select({ organizationId: member.organizationId, role: member.role })
    .from(member)
    .where(eq(member.userId, userId));

  const workspaceIds = memberships.map((row) => row.organizationId);
  if (workspaceIds.length === 0) {
    return [];
  }

  const [rows, memberCounts] = await Promise.all([
    ctx.db.query.workspace.findMany({
      where: inArray(workspace.id, workspaceIds),
      columns: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        timezone: true,
      },
      with: {
        subscriptions: {
          where: activeSubscriptionFilter(),
          orderBy: desc(subscription.createdAt),
          limit: 1,
          columns: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
          },
        },
      },
      orderBy: desc(workspace.createdAt),
    }),
    ctx.db
      .select({ workspaceId: member.organizationId, total: count() })
      .from(member)
      .where(inArray(member.organizationId, workspaceIds))
      .groupBy(member.organizationId),
  ]);

  const roles = new Map(
    memberships.map((row) => [row.organizationId, row.role])
  );
  const totals = new Map(
    memberCounts.map((row) => [row.workspaceId, row.total])
  );

  return rows.map(({ subscriptions, ...found }) => {
    const activeSubscription = subscriptions.at(0) ?? null;
    return {
      ...found,
      currentUserRole: roles.get(found.id) ?? null,
      memberCount: totals.get(found.id) ?? 0,
      subscription: activeSubscription
        ? {
            ...activeSubscription,
            activePlan: getWorkspacePlan(activeSubscription),
          }
        : null,
    };
  });
}

/** The workspace's members with their profiles, oldest first. */
export function listWorkspaceMembers(
  ctx: { db: DbClient },
  workspaceId: string
) {
  return ctx.db.query.member.findMany({
    where: eq(member.organizationId, workspaceId),
    columns: { id: true, role: true, createdAt: true, userId: true },
    with: {
      user: { columns: { id: true, name: true, email: true, image: true } },
    },
    orderBy: asc(member.createdAt),
  });
}

/** Every invitation to the workspace, whatever its status. */
export function listWorkspaceInvitations(
  ctx: { db: DbClient },
  workspaceId: string
) {
  return ctx.db.query.invitation.findMany({
    where: eq(invitation.organizationId, workspaceId),
    columns: {
      id: true,
      email: true,
      role: true,
      status: true,
      inviterId: true,
      expiresAt: true,
    },
  });
}
