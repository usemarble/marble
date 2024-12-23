import { cookies } from "next/headers";
import { type Workspace } from "@repo/db/client";

const WORKSPACE_COOKIE_NAME = "active_workspace";

export async function setActiveWorkspace(
  workspace: Pick<Workspace, "id" | "slug">,
) {
  (await cookies()).set(WORKSPACE_COOKIE_NAME, JSON.stringify(workspace), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}

export async function getActiveWorkspace() {
  const workspaceCookie = (await cookies()).get(WORKSPACE_COOKIE_NAME);
  if (!workspaceCookie) return null;

  try {
    return JSON.parse(workspaceCookie.value) as Pick<Workspace, "id" | "slug">;
  } catch {
    return null;
  }
}
