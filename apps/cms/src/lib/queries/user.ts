import { db } from "@marble/drizzle";
import { member, user } from "@marble/drizzle/schema";
import { and, eq } from "@marble/drizzle/operators";
import { getServerSession } from "@/lib/auth/session";

export async function getInitialUserData() {
  try {
    const sessionData = await getServerSession();

    if (!sessionData || !sessionData.user) {
      return { user: null, isAuthenticated: false };
    }

    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, sessionData.user.id),
    });

    if (!foundUser) {
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

    const foundMember = activeOrganizationId
      ? await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, activeOrganizationId),
            eq(member.userId, foundUser.id)
          ),
          with: {
            organization: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })
      : null;

    const userWithRole = {
      ...foundUser,
      workspaceRole: foundMember?.role || null,
      activeWorkspace: foundMember?.organization || null,
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
