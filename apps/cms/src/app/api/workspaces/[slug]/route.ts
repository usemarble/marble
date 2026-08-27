import { db } from "@marble/drizzle";
import { subscription, workspace } from "@marble/drizzle/schema";
import { activeSubscriptionWhere } from "@/lib/subscription/active-subscription";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth/access";
import { mapWorkspaceListItem } from "@/lib/queries/workspace-view";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;

  const accessData = await requireWorkspaceAccess(slug);
  if (!accessData.ok) {
    return accessData.response;
  }

  const foundWorkspace = await db.query.workspace.findFirst({
    where: and(eq(workspace.slug, slug), eq(workspace.id, accessData.workspaceId)),
    columns: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
      timezone: true,
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
  });

  if (!foundWorkspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const workspaceWithUserRole = mapWorkspaceListItem(
    foundWorkspace,
    accessData.sessionData.user.id
  );

  if (!workspaceWithUserRole) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspaceWithUserRole);
}
