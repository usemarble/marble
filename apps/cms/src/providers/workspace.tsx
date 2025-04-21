"use client";

import { organization } from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth/types";
import { setLastVisitedWorkspace } from "@/utils/workspace";
import { useParams, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

// Type for partial workspace data that doesn't require full member details
// This is because the response from creating a workpace doesnt return what is fully expexted by the ActiveOrganization type
// So we set it like is and then fetch the full data after
type PartialWorkspace = Omit<ActiveOrganization, "members"> & {
  members: Array<{
    id: string;
    createdAt: Date;
    userId: string;
    organizationId: string;
    role: string;
    teamId?: string;
  }>;
};

interface WorkspaceContextType {
  activeWorkspace: ActiveOrganization | null;
  updateActiveWorkspace: (
    workspaceSlug: string,
    newWorkspace?: Partial<PartialWorkspace>,
  ) => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspace: string }>();
  const pathname = usePathname();

  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function updateActiveWorkspace(
    workspaceSlug: string,
    newWorkspace?: Partial<PartialWorkspace>,
  ) {
    setIsLoading(true);
    try {
      // Optimistically update if we have new workspace data
      if (newWorkspace) {
        setActiveWorkspace(
          (prev) =>
            ({
              ...prev,
              ...newWorkspace,
              slug: workspaceSlug,
            }) as ActiveOrganization,
        );
      }

      // Update the active organization
      await organization.setActive({
        organizationSlug: workspaceSlug,
      });

      // Set last visited workspace to cookies
      setLastVisitedWorkspace(workspaceSlug);

      // Fetch full workspace data
      const res = await fetch(`/api/workspaces/${workspaceSlug}`);
      const data: ActiveOrganization | null = await res.json();

      if (!data) {
        throw new Error("Workspace not found");
      }

      setActiveWorkspace(data);
    } catch (error) {
      console.error(error);
      // Revert optimistic update if needed
      if (newWorkspace) {
        setActiveWorkspace(activeWorkspace);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const workspaceSlug = Array.isArray(params.workspace)
      ? params.workspace[0]
      : params.workspace;
    if (
      workspaceSlug &&
      (!activeWorkspace || activeWorkspace.slug !== workspaceSlug)
    ) {
      updateActiveWorkspace(workspaceSlug);
    }
  }, [pathname, params.workspace]);

  return (
    <WorkspaceContext.Provider
      value={{ activeWorkspace, updateActiveWorkspace, isLoading }}
    >
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
