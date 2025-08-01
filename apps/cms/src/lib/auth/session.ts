import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Retrieves the current user session from the authentication API using the request headers.
 *
 * @returns The session object if retrieval is successful; otherwise, `null` if an error occurs.
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Error getting server session", error);
    return null;
  }
}
