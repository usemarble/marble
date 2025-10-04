import { db } from "@marble/db";
import { getServerSession } from "@/lib/auth/session";

export async function getInitialUserData() {
  try {
    const sessionData = await getServerSession();

    if (!sessionData || !sessionData.user) {
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

    const member = activeOrganizationId
      ? await db.member.findFirst({
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
        })
      : null;

    const userWithRole = {
      ...user,
      workspaceRole: member?.role || null,
      activeWorkspace: member?.organization || null,
    };

    return { user: userWithRole, isAuthenticated: true };
  } catch (error) {
    console.error("Error fetching initial user data:", error);
    return { user: null, isAuthenticated: false };
  }
}

// export async function getInitialUserData() {
//   try {
//     const sessionData = await getServerSession();

//     if (!sessionData || !sessionData.user) {
//       return { user: null, isAuthenticated: false };
//     }

//     console.log("sessionData at point of getting user data", sessionData);

//     const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user`);

//     if (response.status === 200) {
//       const userData = (await response.json()) as UserProfile;
//       console.log("userData", userData);
//       return { user: userData, isAuthenticated: true };
//     }
//     // If API call fails, fall back to basic session data
//     console.warn(
//       "Failed to fetch user data from API, falling back to session data",
//     );
//     return { user: null, isAuthenticated: true };
//   } catch (error) {
//     console.error("Error fetching initial user data:", error);
//     return { user: null, isAuthenticated: false };
//   }
// }
