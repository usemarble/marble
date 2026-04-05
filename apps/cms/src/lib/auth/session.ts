import { headers } from "next/headers";
import { auth } from "./server";

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
