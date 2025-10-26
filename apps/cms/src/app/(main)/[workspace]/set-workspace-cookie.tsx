"use client";

import { useEffect } from "react";
import { setWorkspaceCookieAction } from "./actions";

export function SetWorkspaceCookie({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  useEffect(() => {
    setWorkspaceCookieAction(workspaceSlug);
  }, [workspaceSlug]);

  return null;
}
