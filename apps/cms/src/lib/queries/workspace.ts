import { db } from "@marble/drizzle";
import { member, subscription, workspace } from "@marble/drizzle/schema";
import { and, desc, eq, gt, or } from "drizzle-orm";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getServerSession } from "@/lib/auth/session";
import { getWorkspacePlan } from "@/lib/plans";
import type { Workspace } from "@/types/workspace";
import { getLastVisitedWorkspace } from "@/utils/workspace/client";

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
      const rows = await db
        .select({ slug: workspace.slug, id: workspace.id })
        .from(workspace)
        .innerJoin(member, eq(member.organizationId, workspace.id))
        .where(
          and(
            eq(workspace.slug, lastVisitedWorkspaceSlug),
            eq(member.userId, userId)
          )
        )
        .limit(1);

      const foundWorkspace = rows.at(0);
      if (foundWorkspace) {
        return {
          slug: foundWorkspace.slug,
          id: foundWorkspace.id,
        };
      }
    }
  }

  const ownerRows = await db
    .select({ slug: workspace.slug, id: workspace.id })
    .from(workspace)
    .innerJoin(member, eq(member.organizationId, workspace.id))
    .where(and(eq(member.userId, userId), eq(member.role, "owner")))
    .limit(1);

  const ownerWorkspace = ownerRows.at(0);
  if (ownerWorkspace) {
    return {
      slug: ownerWorkspace.slug,
      id: ownerWorkspace.id,
    };
  }

  const memberRows = await db
    .select({ slug: workspace.slug, id: workspace.id })
    .from(workspace)
    .innerJoin(member, eq(member.organizationId, workspace.id))
    .where(eq(member.userId, userId))
    .limit(1);

  const memberWorkspace = memberRows.at(0);
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
 * If a workspace slug is provided, the function fetches that workspace.
 * Otherwise, it falls back to the user's currently active session workspace.
 *
 * @param {string} [workspaceSlug] - Optional slug of the workspace to fetch.
 * @returns {Promise<Workspace|null>} The workspace data or null if not found.
 */
export async function getInitialWorkspaceData(
  workspaceSlug?: string
): Promise<Workspace | null> {
  const data = await getWorkspaceLayoutData(workspaceSlug);
  return data?.workspace ?? null;
}

export async function getWorkspaceLayoutData(workspaceSlug?: string): Promise<{
  activeOrganizationId: string | null;
  workspace: Workspace | null;
} | null> {
  try {
    const session = await getServerSession();
    const activeOrganizationId = session?.session?.activeOrganizationId ?? null;

    if (!session?.user || (!activeOrganizationId && !workspaceSlug)) {
      return null;
    }

    const workspaceWhere = workspaceSlug
      ? eq(workspace.slug, workspaceSlug)
      : eq(workspace.id, activeOrganizationId as string);

    const foundWorkspace = await db.query.workspace.findFirst({
      where: workspaceWhere,
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
            userId: true,
            organizationId: true,
            createdAt: true,
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
          where: or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
            and(
              eq(subscription.status, "canceled"),
              eq(subscription.cancelAtPeriodEnd, true),
              gt(subscription.currentPeriodEnd, new Date())
            )
          ),
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
      return { activeOrganizationId, workspace: null };
    }

    const currentUserMember = foundWorkspace.members.find(
      (entry) => entry.userId === session.user.id
    );

    if (!currentUserMember) {
      return { activeOrganizationId, workspace: null };
    }

    const activeSubscription = foundWorkspace.subscriptions.at(0) || null;
    const activePlan = getWorkspacePlan(activeSubscription);

    return {
      activeOrganizationId,
      workspace: {
        ...foundWorkspace,
        currentUserRole: currentUserMember.role || null,
        subscription: activeSubscription
          ? {
              ...activeSubscription,
              activePlan,
            }
          : null,
      } as Workspace,
    };
  } catch (error) {
    console.error("Error fetching initial workspace data:", error);
    return null;
  }
}

/**
 * Validates whether the given workspace slug exists and the active user has access to it.
 *
 * @param slug - The workspace slug to validate.
 * @returns {Promise<boolean>} True if the workspace exists and the user is a member.
 */
export async function validateWorkspaceAccess(slug: string): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user) {
    return false;
  }

  const rows = await db
    .select({ id: workspace.id })
    .from(workspace)
    .innerJoin(member, eq(member.organizationId, workspace.id))
    .where(and(eq(workspace.slug, slug), eq(member.userId, session.user.id)))
    .limit(1);

  return Boolean(rows.at(0));
}
