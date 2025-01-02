import { auth } from "../auth";
import { headers } from "next/headers";

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