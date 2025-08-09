import { db } from "@marble/db";
import { getServerSession } from "@/lib/auth/session";
import { WorkspaceProvider } from "@/providers/workspace";
import type { Workspace } from "@/types/workspace";

async function getInitialWorkspaceData(): Promise<Workspace | null> {
  try {
    const session = await getServerSession();

    if (!(session?.user && session.session?.activeOrganizationId)) {
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
      (member) => member.userId === session.user.id
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
