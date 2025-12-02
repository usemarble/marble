import { Polar } from "@polar-sh/sdk";

export function createPolarClient(accessToken: string, isProduction = false) {
  return new Polar({
    server: isProduction ? "production" : "sandbox",
    accessToken,
  });
}
