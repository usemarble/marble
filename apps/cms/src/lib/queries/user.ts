import { getServerSession } from "@/lib/auth/session";
import type { UserProfile } from "@/types/user";

export async function getInitialUserData() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return { user: null, isAuthenticated: false };
    }

    // If there's a session, fetch complete user data from our API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const response = await fetch(`${baseUrl}/api/user`);

    if (response.ok) {
      const userData = (await response.json()) as UserProfile;
      console.log("userData", userData);
      return { user: userData, isAuthenticated: true };
    }
    // If API call fails, fall back to basic session data
    console.warn(
      "Failed to fetch user data from API, falling back to session data",
    );
    return { user: null, isAuthenticated: true };
  } catch (error) {
    console.error("Error fetching initial user data:", error);
    return { user: null, isAuthenticated: false };
  }
}
