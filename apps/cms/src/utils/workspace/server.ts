"use server";

import { cookies } from "next/headers";
import { lastVisitedWorkspace } from "./constants";

/**
 * Sets the last visited workspace cookie on the server.
 *
 * Use inside API routes, server actions, or other server-side code.
 *
 * @param workspace - The workspace slug to store in the cookie.
 * @param maxAge - Cookie lifetime in seconds (defaults to 30 days).
 */
export const setServerLastVisitedWorkspace = async (
  workspace: string,
  maxAge: number = 30 * 86_400
) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: lastVisitedWorkspace,
    value: workspace,
    path: "/",
    maxAge,
    sameSite: "lax",
    // httpOnly: true, // optional if not needed by client JS
  });
};

/**
 * Reads the last visited workspace cookie on the server.
 *
 * @returns The stored workspace slug, or undefined if not present.
 */
export const getServerLastVisitedWorkspace = async (): Promise<
  string | undefined
> => {
  const cookieStore = await cookies();
  return cookieStore.get(lastVisitedWorkspace)?.value;
};
