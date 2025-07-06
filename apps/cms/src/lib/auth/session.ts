import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (_error) {
    return null;
  }
}
