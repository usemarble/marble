"use client";
import { authClient } from "@/lib/auth/client";

import type { Organization } from "@repo/db/client";
import { useParams, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface WorkspaceContextType {
  workspace: Pick<Organization, "id" | "slug" | "name" | "logo"> | null;
  setWorkspace: (
    workspace: Pick<Organization, "id" | "slug" | "name" | "logo"> | null,
  ) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Pick<
    Organization,
    "id" | "slug" | "name" | "logo"
  > | null>(null);
  const params = useParams();
  const pathname = usePathname();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <ignore>
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
        .then((data) =>
          setWorkspace({
            id: data.id,
            slug: data.slug,
            name: data.name,
            logo: data.logo,
          }),
        );
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
