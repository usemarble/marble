import { HTTPClient, Polar } from "@polar-sh/sdk";

export const POLAR_API_VERSION = "2026-04";

function createVersionedHttpClient() {
  const httpClient = new HTTPClient();

  httpClient.addHook("beforeRequest", (request) => {
    request.headers.set("Polar-Version", POLAR_API_VERSION);
  });

  return httpClient;
}

export function createPolarClient(
  accessToken: string,
  server: "production" | "sandbox" = "sandbox"
) {
  return new Polar({
    server,
    accessToken,
    httpClient: createVersionedHttpClient(),
  });
}
