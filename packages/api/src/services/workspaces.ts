import type { DbClient } from "@marble/db";
import { member, subscription, workspace } from "@marble/db/schema";
import { getWorkspacePlan } from "@marble/utils";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";

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

/** Every workspace the user belongs to, newest first, with the caller's role. */
export async function listWorkspaces(ctx: { db: DbClient }, userId: string) {
  const memberships = await ctx.db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));

  const workspaceIds = memberships.map((row) => row.organizationId);
  if (workspaceIds.length === 0) {
    return [];
  }

  const rows = await ctx.db.query.workspace.findMany({
    where: inArray(workspace.id, workspaceIds),
    columns: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      timezone: true,
      createdAt: true,
    },
    with: {
      members: {
        columns: {
          id: true,
          role: true,
          organizationId: true,
          createdAt: true,
          userId: true,
        },
        with: {
          user: {
            columns: { id: true, name: true, email: true, image: true },
          },
        },
      },
      invitations: {
        columns: {
          id: true,
          email: true,
          role: true,
          status: true,
          organizationId: true,
          inviterId: true,
          expiresAt: true,
        },
      },
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
  });

  return rows.map(({ subscriptions, ...found }) => {
    const activeSubscription = subscriptions.at(0) ?? null;
    return {
      ...found,
      currentUserRole:
        found.members.find((entry) => entry.userId === userId)?.role ?? null,
      subscription: activeSubscription
        ? {
            ...activeSubscription,
            activePlan: getWorkspacePlan(activeSubscription),
          }
        : null,
    };
  });
}
