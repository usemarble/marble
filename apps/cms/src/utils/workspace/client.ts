import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { lastVisitedWorkspace } from "./constants";

/**
 * Sets the last visited workspace in a cookie.
 * @param workspace The slug of the workspace to set as last visited.
 * @param maxAge The maximum age of the cookie in seconds.
 */
export const setLastVisitedWorkspace = (
  workspace: string,
  maxAge: number = 30 * 86_400
) => {
  // biome-ignore lint/suspicious/noDocumentCookie: <>
  document.cookie = `${lastVisitedWorkspace}=${workspace}; max-age=${maxAge}; path=/`;
};

/**
 * Retrieves the last visited workspace from cookies.
 * @param cookies The RequestCookies or ReadonlyRequestCookies object to read from.
 * @returns The slug of the last visited workspace, or undefined if not set.
 */
export const getLastVisitedWorkspace = (
  cookies: RequestCookies | ReadonlyRequestCookies
): string | undefined => cookies.get(lastVisitedWorkspace)?.value;
