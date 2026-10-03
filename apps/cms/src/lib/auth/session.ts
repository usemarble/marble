import { headers } from "next/headers";
import { authClient } from "./client";

/** Reads the session from the API Worker, forwarding the request's cookies. */
export async function getServerSession() {
  const { data, error } = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
