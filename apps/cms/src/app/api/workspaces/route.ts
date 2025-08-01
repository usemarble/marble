import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

/**
 * Handles GET requests to retrieve all workspaces associated with the authenticated user.
 *
 * Returns a JSON array of organizations where the user is a member, including organization details, members, invitations, subscription information, and the user's role within each workspace. Responds with a 401 status code if the user is not authenticated.
 */
export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaces = await db.organization.findMany({
    where: {
      members: {
        some: {
          userId: sessionData.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      timezone: true,
      createdAt: true,
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
      subscription: {
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
    orderBy: {
      createdAt: "desc",
    },
  });

  const workspacesWithRole = workspaces.map((workspace) => {
    const currentUserMember = workspace.members.find(
      (member) => member.userId === sessionData.user.id,
    );
    return {
      ...workspace,
      currentUserRole: currentUserMember?.role || null,
    };
  });

  return NextResponse.json(workspacesWithRole);
}
