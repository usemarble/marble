import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth/access";
import { getWorkspacePlan } from "@/lib/plans";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;

  const accessData = await requireWorkspaceAccess(slug);
  if (!accessData.ok) {
    return accessData.response;
  }

  const workspace = await db.organization.findFirst({
    where: {
      slug,
      id: accessData.workspaceId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
      timezone: true,
      members: {
        select: {
          id: true,
          role: true,
          organizationId: true,
          createdAt: true,
          userId: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      invitations: {
        select: {
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
        where: {
          OR: [
            { status: "active" },
            { status: "trialing" },
            {
              status: "canceled",
              cancelAtPeriodEnd: true,
              currentPeriodEnd: { gt: new Date() },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
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

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Find current user's role in this workspace
  const currentUserMember = workspace.members.find(
    (member) => member.userId === accessData.sessionData.user.id
  );

  const currentUserRole = currentUserMember?.role || null;
  const activeSubscription = workspace.subscriptions[0] || null;
  const activePlan = getWorkspacePlan(activeSubscription);

  const workspaceWithUserRole = {
    ...workspace,
    currentUserRole,
    subscription: activeSubscription
      ? {
          ...activeSubscription,
          activePlan,
        }
      : null,
  };

  return NextResponse.json(workspaceWithUserRole);
}
