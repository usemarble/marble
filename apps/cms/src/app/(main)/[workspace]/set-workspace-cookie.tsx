"use client";

import { useEffect } from "react";
import { setLastVisitedWorkspace } from "@/utils/workspace/client";

export function SetWorkspaceCookie({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  useEffect(() => {
    setLastVisitedWorkspace(workspaceSlug);
  }, [workspaceSlug]);

  return null;
}
