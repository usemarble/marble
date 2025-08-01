import { db } from "@marble/db";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { Workspace } from "@/types/workspace";
import { getLastVisitedWorkspace } from "@/utils/workspace";
import { getServerSession } from "../auth/session";

export async function getLastActiveWorkspaceOrNewOneToSetAsActive(
  userId: string,
  cookies?: RequestCookies,
) {
  if (cookies) {
    const lastVisitedWorkspaceSlug = getLastVisitedWorkspace(cookies);
    if (lastVisitedWorkspaceSlug) {
      // Check if user still has access to this workspace
      const workspace = await db.organization.findFirst({
        where: {
          slug: lastVisitedWorkspaceSlug,
          members: {
            some: {
              userId: userId,
            },
          },
        },
        select: { slug: true, id: true },
      });

      if (workspace) {
        return {
          slug: workspace.slug,
          id: workspace.id,
        };
      }
    }
  }

  // If no last visited workspace or user lost access, try to find a workspace where user is owner
  const ownerWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: userId,
          role: "owner",
        },
      },
    },
    select: { slug: true, id: true },
  });

  if (ownerWorkspace) {
    return {
      slug: ownerWorkspace.slug,
      id: ownerWorkspace.id,
    };
  }

  // If no owner workspace, check for any workspace user is a member of
  const memberWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    select: { slug: true, id: true },
  });

  if (memberWorkspace) {
    return {
      slug: memberWorkspace.slug,
      id: memberWorkspace.id,
    };
  }
}

export async function getInitialWorkspaceData() {
  try {
    const session = await getServerSession();

    if (!session?.user || !session.session?.activeOrganizationId) {
      return null;
    }

    const workspace = await db.organization.findUnique({
      where: { id: session.session.activeOrganizationId as string },
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
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
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
    });

    if (!workspace) {
      return null;
    }

    // Find current user's role in this workspace
    const currentUserMember = workspace.members.find(
      (member) => member.userId === session.user.id,
    );

    return {
      ...workspace,
      currentUserRole: currentUserMember?.role || null,
    } as Workspace;
  } catch (error) {
    console.error("Error fetching initial workspace data:", error);
    return null;
  }
}
