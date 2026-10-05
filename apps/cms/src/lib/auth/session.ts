import { headers } from "next/headers";
import { authClient } from "./client";

/**
 * Reads the session from the API Worker, forwarding only the request's
 * cookies. Forwarding every header would pass on the browser's
 * `accept-encoding`, and Cloudflare would answer with zstd, which Node 22's
 * fetch returns undecoded.
 */
export async function getServerSession() {
  const cookie = (await headers()).get("cookie");
  const { data, error } = await authClient.getSession({
    fetchOptions: { headers: cookie ? { cookie } : {} },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (data !== null && typeof data?.user !== "object") {
    throw new Error("The API returned an unreadable session response");
  }
  return data;
}
