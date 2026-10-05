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

/** Forgets the last visited workspace, e.g. when the user signs out. */
export const clearLastVisitedWorkspace = () => {
  // biome-ignore lint/suspicious/noDocumentCookie: <>
  document.cookie = `${lastVisitedWorkspace}=; max-age=0; path=/`;
};

/**
 * Retrieves the last visited workspace from cookies.
 * @param cookies The RequestCookies or ReadonlyRequestCookies object to read from.
 * @returns The slug of the last visited workspace, or undefined if not set.
 */
export const getLastVisitedWorkspace = (): string | undefined => {
  const value = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${lastVisitedWorkspace}=`))
    ?.slice(lastVisitedWorkspace.length + 1);
  return value || undefined;
};
