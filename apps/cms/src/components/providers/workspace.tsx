"use client";

import type { Workspace } from "@repo/db/client";
import { useParams, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface WorkspaceContextType {
  workspace: Pick<Workspace, "id" | "slug"> | null;
  setWorkspace: (workspace: Pick<Workspace, "id" | "slug"> | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Pick<
    Workspace,
    "id" | "slug"
  > | null>(null);
  const params = useParams();
  const pathname = usePathname();

  useEffect(() => {
    // Update workspace from URL when path changes
    const workspaceSlug = Array.isArray(params.workspace)
      ? params.workspace[0]
      : params.workspace;
    if (workspaceSlug && (!workspace || workspace.slug !== workspaceSlug)) {
      // Fetch workspace details from API
      fetch(`/api/workspaces/${workspaceSlug}`)
        .then((res) => res.json())
        .then((data) => setWorkspace({ id: data.id, slug: data.slug }));
    }
  }, [pathname, params.workspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
