import { db } from "@marble/db";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getServerSession } from "@/lib/auth/session";
import { workspaceSelect } from "@/lib/db/select";
import type { Workspace } from "@/types/workspace";
import { getLastVisitedWorkspace } from "@/utils/workspace";

/**
 * Determines which workspace should be activated for a given user.
 *
 * The function checks, in order:
 *  1. The user's **last visited workspace** (stored in cookies),
 *     verifying they still have access to it.
 *  2. If not found or access was lost, the first workspace where the user is an **owner**.
 *  3. If still none, the first workspace where the user is a **member**.
 *
 * Returns the workspace's `slug` and `id`, or `undefined` if the user has no accessible workspaces.
 *
 * @param userId - The ID of the user to look up workspaces for.
 * @param cookies - Optional Next.js `RequestCookies` object, used to read the last visited workspace.
 * @returns An object containing `{ slug, id }` for the selected workspace, or `undefined` if none found.
 */
export async function getLastActiveWorkspaceOrNewOneToSetAsActive(
  userId: string,
  cookies?: RequestCookies
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
              userId,
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
          userId,
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
          userId,
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

/**
 * Fetches the initial workspace data for the active user.
 *
 * If a workspace slug is provided, the function attempts to fetch
 * that workspace (checking membership). Otherwise, it falls back
 * to the user's currently active session workspace.
 *
 * @param {string} [workspaceSlug] - Optional slug of the workspace to fetch.
 * @returns {Promise<Workspace|null>} The workspace data or null if not found.
 */
export async function getInitialWorkspaceData() {
  try {
    const session = await getServerSession();

    if (!session?.user || !session.session?.activeOrganizationId) {
      return null;
    }

    const workspace = await db.organization.findUnique({
      where: { id: session.session.activeOrganizationId },
      select: workspaceSelect,
    });

    if (!workspace) {
      return null;
    }

    // Find current user's role in this workspace
    const currentUserMember = workspace.members.find(
      (member) => member.userId === session.user.id
    );

    return {
      ...workspace,
      ai: workspace.editorPreferences?.ai ?? { enabled: false },
      currentUserRole: currentUserMember?.role || null,
    } as Workspace;
  } catch (error) {
    console.error("Error fetching initial workspace data:", error);
    return null;
  }
}
