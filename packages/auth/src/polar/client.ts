import { HTTPClient, Polar } from "@polar-sh/sdk";
import type { AuthEnv } from "../env";

export const POLAR_API_VERSION = "2026-04";

export type PolarServer = "production" | "sandbox";

/**
 * POLAR_SERVER overrides the NODE_ENV default so staging, which runs a
 * production build, can still talk to the Polar sandbox.
 */
export function polarServer({
  POLAR_SERVER,
  NODE_ENV,
}: Pick<AuthEnv, "POLAR_SERVER" | "NODE_ENV">): PolarServer {
  if (POLAR_SERVER === "production" || POLAR_SERVER === "sandbox") {
    return POLAR_SERVER;
  }
  return NODE_ENV === "production" ? "production" : "sandbox";
}

export function createPolarSdkClient(
  accessToken: string | undefined,
  server: PolarServer
): Polar {
  const httpClient = new HTTPClient();

  httpClient.addHook("beforeRequest", (request) => {
    request.headers.set("Polar-Version", POLAR_API_VERSION);
  });

  return new Polar({
    accessToken,
    server,
    httpClient,
  });
}
