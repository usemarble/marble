import { headers } from "next/headers";
import { auth } from "./auth";

async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    return null;
  }
}

export default getServerSession;
