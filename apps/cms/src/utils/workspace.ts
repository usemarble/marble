import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

const lastVisitedWorkspace = "last-visited-workspace";

export const setLastVisitedWorkspace = (
  workspace: string,
  maxAge: number = 30 * 86400,
) => {
  document.cookie = `${lastVisitedWorkspace}=${workspace}; max-age=${maxAge}; path=/`;
};

export const getLastVisitedWorkspace = (
  cookies: RequestCookies,
): string | undefined => {
  return cookies.get(lastVisitedWorkspace)?.value;
};
