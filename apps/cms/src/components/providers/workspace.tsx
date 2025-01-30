"use client";
import {
  authClient,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth/types";
import { useParams, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface WorkspaceContextType {
  workspace: ActiveOrganization | null;
  setWorkspace: (workspace: ActiveOrganization | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();

  const [workspace, setWorkspace] = useState<ActiveOrganization | null>(null);

  const { data: organizations } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Update workspace from URL when path changes
    const workspaceSlug = Array.isArray(params.workspace)
      ? params.workspace[0]
      : params.workspace;
    if (workspaceSlug && (!workspace || workspace.slug !== workspaceSlug)) {
      // Fetch workspace details from API
      //       await authClient.organization.setActive({
      //   organizationId: "organization-id"
      // })

      fetch(`/api/workspaces/${workspaceSlug}`)
        .then((res) => res.json())
        .then((data) => setWorkspace(data))
        .catch((err) => {
          console.error(err);
        });
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
