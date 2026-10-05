import { polarClient } from "@polar-sh/better-auth/client";
import type { BetterAuthClientOptions } from "better-auth";
import {
  emailOTPClient,
  inferOrgAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import type { Auth } from "./index";

/**
 * Builds the browser auth client with the plugins matching `createAuth`.
 * Callers supply the base URL and any fetch handling (e.g. error toasts).
 */
export function createAuthClient(
  options: Pick<BetterAuthClientOptions, "baseURL" | "fetchOptions">
) {
  return createBetterAuthClient({
    ...options,
    plugins: [
      organizationClient({ schema: inferOrgAdditionalFields<Auth>() }),
      emailOTPClient(),
      polarClient(),
    ],
  });
}
