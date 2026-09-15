import { HTTPClient, Polar } from "@polar-sh/sdk";

let cachedPolarClient: Polar | null = null;

export const POLAR_API_VERSION = "2026-04";

export function createPolarSdkClient(accessToken: string | undefined): Polar {
  const httpClient = new HTTPClient();

  httpClient.addHook("beforeRequest", (request) => {
    request.headers.set("Polar-Version", POLAR_API_VERSION);
  });

  return new Polar({
    accessToken,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    httpClient,
  });
}

export function createPolarClient(): Polar | null {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return null;
  }

  if (!cachedPolarClient) {
    cachedPolarClient = createPolarSdkClient(process.env.POLAR_ACCESS_TOKEN);
  }

  return cachedPolarClient;
}
