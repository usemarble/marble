import { ORPCError } from "@orpc/client";

/**
 * Whether the request failed because the plan does not include the feature.
 * Reachable when the client's cached subscription is stale, and retrying can
 * never succeed - the caller should offer an upgrade instead.
 */
export function isAiEntitlementError(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "FORBIDDEN";
}

/** Reader-facing explanation for a failed suggestions request. */
export function getAiSuggestionsErrorMessage(error: unknown): string {
  if (error instanceof ORPCError && error.code === "TOO_MANY_REQUESTS") {
    return "You've hit the suggestion limit. Try again in a few minutes.";
  }
  return "We couldn't generate suggestions just now.";
}
