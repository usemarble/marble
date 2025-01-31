"use client";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth/types";
import { useParams, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface ListOrganizationResponse {
  // biome-ignore lint/suspicious/noExplicitAny: <better auth has it as any>
  metadata?: any;
  name: string;
  slug: string;
  logo?: string | null | undefined | undefined;
  createdAt: Date;
  id: string;
}

interface WorkspaceContextType {
  activeWorkspace: ActiveOrganization | null;
  updateActiveWorkspace: (
    workspaceSlug: string,
    newWorkspace?: Partial<ActiveOrganization>,
  ) => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspace: string }>();
  const pathname = usePathname();

  const { data: activeOrganization } = useActiveOrganization();

  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveOrganization | null>(activeOrganization);
  const [isLoading, setIsLoading] = useState(false);

  async function updateActiveWorkspace(
    workspaceSlug: string,
    newWorkspace?: Partial<ActiveOrganization>,
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
      const newActiveOrg = await organization.setActive({
        organizationSlug: workspaceSlug,
      });

      console.log(newActiveOrg);

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
    // Update workspace from URL when path changes
    const workspaceSlug = Array.isArray(params.workspace)
      ? params.workspace[0]
      : params.workspace;
    if (
      workspaceSlug &&
      (!activeWorkspace || activeWorkspace.slug !== workspaceSlug)
    ) {
      const fetchOrganization = async () => {
        try {
          const res = await fetch(`/api/workspaces/${workspaceSlug}`);
          const data: ActiveOrganization | null = await res.json();

          if (!data) {
            console.error("Workspace not found");
            return;
          }

          setActiveWorkspace(data);

          const newActiveOrg = await organization.setActive({
            organizationSlug: workspaceSlug,
          });

          console.log(newActiveOrg);
        } catch (error) {
          console.error(error);
        }
      };

      fetchOrganization();
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
