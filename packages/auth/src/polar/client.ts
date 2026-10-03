import { HTTPClient, Polar } from "@polar-sh/sdk";

export const POLAR_API_VERSION = "2026-04";

export type PolarServer = "production" | "sandbox";

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
