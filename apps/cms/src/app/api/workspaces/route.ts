import { db } from "@marble/db";
import { member, subscription, workspace } from "@marble/db/schema";
import { getWorkspacePlan } from "@marble/utils";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth/client";

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

export async function GET() {
  const { data: sessionData, error: sessionError } =
    await authClient.getSession({
      fetchOptions: { headers: await headers() },
    });
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!sessionData?.user.emailVerified) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberRows = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, sessionData.user.id));

  const workspaceIds = memberRows.map((row) => row.organizationId);

  if (workspaceIds.length === 0) {
    return NextResponse.json([]);
  }

  const workspaces = await db.query.workspace.findMany({
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

  const workspacesWithRole = workspaces.map((foundWorkspace) => {
    const currentUserMember = foundWorkspace.members.find(
      (entry) => entry.userId === sessionData.user.id
    );
    const activeSubscription = foundWorkspace.subscriptions.at(0) || null;
    const activePlan = getWorkspacePlan(activeSubscription);
    return {
      ...foundWorkspace,
      currentUserRole: currentUserMember?.role || null,
      subscription: activeSubscription
        ? {
            ...activeSubscription,
            activePlan,
          }
        : null,
    };
  });

  return NextResponse.json(workspacesWithRole);
}
