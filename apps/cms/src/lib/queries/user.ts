import { db } from "@marble/db";
import { getServerSession } from "@/lib/auth/session";

export async function getInitialUserData() {
  const sessionData = await getServerSession();

  if (!sessionData?.user) {
    return { user: null, isAuthenticated: false };
  }

  const user = await db.user.findUnique({
    where: { id: sessionData.user.id },
  });

  if (!user) {
    return { user: null, isAuthenticated: false };
  }

  const activeOrganizationId = sessionData.session?.activeOrganizationId;

  if (activeOrganizationId && typeof activeOrganizationId !== "string") {
    console.warn(
      "Invalid activeOrganizationId type:",
      typeof activeOrganizationId
    );
    return { user: null, isAuthenticated: true };
  }

  // biome-ignore lint/suspicious/noEvolvingTypes: <explanation>
  let member = null;

  if (activeOrganizationId) {
    member = await db.member.findFirst({
      where: {
        organizationId: activeOrganizationId,
        userId: user.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  const userWithRole = {
    ...user,
    workspaceRole: member?.role || null,
    activeWorkspace: member?.organization || null,
  };

  return { user: userWithRole, isAuthenticated: true };
}
