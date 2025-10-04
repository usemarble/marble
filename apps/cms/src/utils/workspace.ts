import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const lastVisitedWorkspace = "last-visited-workspace";

export const setLastVisitedWorkspace = (
  workspace: string,
  maxAge: number = 30 * 86_400
) => {
  // biome-ignore lint/suspicious/noDocumentCookie: <>
  document.cookie = `${lastVisitedWorkspace}=${workspace}; max-age=${maxAge}; path=/`;
};

export const getLastVisitedWorkspace = (
  cookies: RequestCookies | ReadonlyRequestCookies
): string | undefined => {
  return cookies.get(lastVisitedWorkspace)?.value;
};
