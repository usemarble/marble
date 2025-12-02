import { Polar } from "@polar-sh/sdk";

let cachedPolarClient: Polar | null = null;

export function createPolarClient(): Polar | null {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return null;
  }

  if (!cachedPolarClient) {
    cachedPolarClient = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });
  }

  return cachedPolarClient;
}
