import { headers } from "next/headers";
import { auth } from "./server";

interface GetServerSessionOptions {
  allowUnverified?: boolean;
}

export async function getServerSession(options: GetServerSessionOptions = {}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!(options.allowUnverified ?? false) && !session?.user.emailVerified) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error getting server session", error);
    return null;
  }
}
