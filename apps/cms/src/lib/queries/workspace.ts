import { db } from "@marble/db";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getLastVisitedWorkspace } from "@/utils/workspace";

export async function getActiveOrganization(id: string) {
  const workspace = await db.organization.findFirst({
    where: { members: { some: { userId: id } } },
  });

  return workspace;
}

export async function getUserWorkspace(
  userId: string,
  cookies?: RequestCookies
) {
  // First try to get last visited workspace if cookies are provided
  if (cookies) {
    const lastVisitedWorkspace = getLastVisitedWorkspace(cookies);
    if (lastVisitedWorkspace) {
      // Check if user still has access to this workspace
      const workspace = await db.organization.findFirst({
        where: {
          slug: lastVisitedWorkspace,
          members: {
            some: {
              userId,
            },
          },
        },
        select: { slug: true },
      });

      if (workspace) {
        return workspace.slug;
      }
    }
  }

  // If no last visited workspace or user lost access, try to find a workspace where user is owner
  const ownerWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId,
          role: "owner",
        },
      },
    },
    select: { slug: true },
  });

  if (ownerWorkspace) {
    return ownerWorkspace.slug;
  }

  // If no owner workspace, check for any workspace user is a member of
  const memberWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    select: { slug: true },
  });

  if (memberWorkspace) {
    return memberWorkspace.slug;
  }
}
