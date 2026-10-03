import { createPolarSdkClient, polarServer } from "@marble/auth/polar";
import type { Polar } from "@polar-sh/sdk";

let cachedPolarClient: Polar | null = null;

export function createPolarClient(): Polar | null {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return null;
  }

  if (!cachedPolarClient) {
    cachedPolarClient = createPolarSdkClient(
      process.env.POLAR_ACCESS_TOKEN,
      polarServer(process.env)
    );
  }

  return cachedPolarClient;
}
