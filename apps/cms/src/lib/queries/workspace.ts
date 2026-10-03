import { db } from "@marble/db";
import { member, subscription, workspace } from "@marble/db/schema";
import { getWorkspacePlan } from "@marble/utils";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth/client";
import type { Workspace } from "@/types/workspace";

export async function getWorkspaceLayoutData(workspaceSlug?: string): Promise<{
  activeOrganizationId: string | null;
  workspace: Workspace | null;
} | null> {
  try {
    const { data: session, error: sessionError } = await authClient.getSession({
      fetchOptions: { headers: await headers() },
    });
    if (sessionError) {
      throw new Error(sessionError.message);
    }
    const activeOrganizationId = session?.session?.activeOrganizationId ?? null;

    if (
      !session?.user.emailVerified ||
      (!activeOrganizationId && !workspaceSlug)
    ) {
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
