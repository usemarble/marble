import {
  createPolar,
  createPolarCore,
  type Polar,
  type PolarCore,
} from "@polar-sh/sdk/2026-10";

export const POLAR_API_VERSION = "2026-10";

export type PolarServer = "production" | "sandbox";

export function createPolarAuthClient(
  accessToken: string | undefined,
  server: PolarServer
): PolarCore {
  return createPolarCore({
    accessToken: accessToken ?? "",
    environment: server,
  });
}

export function createPolarSdkClient(
  accessToken: string | undefined,
  server: PolarServer
): Polar {
  return createPolar({
    accessToken: accessToken ?? "",
    environment: server,
  });
}
