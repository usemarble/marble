"use server";

import { cookies } from "next/headers";
import { lastVisitedWorkspace } from "@/utils/workspace/constants";

export async function setWorkspaceCookieAction(workspaceSlug: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: lastVisitedWorkspace,
    value: workspaceSlug,
    path: "/",
    maxAge: 30 * 86_400,
    sameSite: "lax",
  });
}