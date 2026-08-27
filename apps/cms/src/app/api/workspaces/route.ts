import { db } from "@marble/drizzle";
import { member, subscription, workspace } from "@marble/drizzle/schema";
import { activeSubscriptionWhere } from "@/lib/subscription/active-subscription";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { mapWorkspaceListItem } from "@/lib/queries/workspace-view";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
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
        where: activeSubscriptionWhere(),
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

  const workspacesWithRole = workspaces.flatMap((foundWorkspace) => {
    const mapped = mapWorkspaceListItem(foundWorkspace, sessionData.user.id);
    return mapped ? [mapped] : [];
  });

  return NextResponse.json(workspacesWithRole);
}
