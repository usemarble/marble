import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import type { ActiveOrganization } from "@/lib/auth/types";
import { WorkspaceProvider } from "@/providers/workspace";

async function getInitialWorkspaceData(): Promise<ActiveOrganization | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.session?.activeOrganizationId) {
      return null;
    }

    // Fetch the active workspace using the activeOrganizationId from session
    const workspace = await db.organization.findUnique({
      where: { id: session.session.activeOrganizationId as string },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
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
        invitations: true,
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
    } as ActiveOrganization;
  } catch (error) {
    console.error("Error fetching initial workspace data:", error);
    return null;
  }
}

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialWorkspace = await getInitialWorkspaceData();

  return (
    <WorkspaceProvider initialWorkspace={initialWorkspace}>
      {children}
    </WorkspaceProvider>
  );
}
