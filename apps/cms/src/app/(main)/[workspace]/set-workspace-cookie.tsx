"use client";

import { useEffect } from "react";
import { setServerLastVisitedWorkspace } from "@/utils/workspace/server";

export function SetWorkspaceCookie({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  useEffect(() => {
    setServerLastVisitedWorkspace(workspaceSlug);
  }, [workspaceSlug]);

  return null;
}
