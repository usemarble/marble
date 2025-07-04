"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useUserWorkspaces } from "@/hooks/use-user-workspace";
import { organization } from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth/types";
import type {
  ActiveWorkspace,
  PartialWorkspace,
  WorkspaceContextType,
  WorkspaceProviderProps,
} from "@/types/workspace";
import { request } from "@/utils/fetch/client";
import { setLastVisitedWorkspace } from "@/utils/workspace";

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({
  children,
  initialWorkspace,
}: WorkspaceProviderProps) {
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();

  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveWorkspace>(initialWorkspace);

  const workspaces = useUserWorkspaces();

  // Get current workspace slug from params
  const workspaceSlug = Array.isArray(params.workspace)
    ? params.workspace[0]
    : params.workspace;

  const fetchWorkspaceData = async (
    slug: string,
  ): Promise<ActiveOrganization> => {
    const response = await request<ActiveOrganization>(`workspaces/${slug}`);
    if (!response.data) {
      throw new Error("Workspace not found");
    }
    return response.data;
  };

  // Determine if we should fetch workspace data
  const shouldFetchWorkspace =
    !!workspaceSlug &&
    (!activeWorkspace || activeWorkspace.slug !== workspaceSlug);

  const { data: fetchedWorkspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () => fetchWorkspaceData(workspaceSlug),
    enabled: shouldFetchWorkspace,
    initialData:
      initialWorkspace && initialWorkspace.slug === workspaceSlug
        ? initialWorkspace
        : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Update activeWorkspace when fetchedWorkspace changes
  useEffect(() => {
    if (fetchedWorkspace) {
      setActiveWorkspace(fetchedWorkspace);
    }
  }, [fetchedWorkspace]);

  // Auto-switch active workspace when URL changes to different workspace
  useEffect(() => {
    if (
      workspaceSlug &&
      activeWorkspace &&
      activeWorkspace.slug !== workspaceSlug &&
      !isLoading
    ) {
      // Only auto-switch if the workspace in URL is different from active workspace
      // This happens when user navigates to different workspace URL
      organization
        .setActive({
          organizationSlug: workspaceSlug,
        })
        .then(() => {
          setLastVisitedWorkspace(workspaceSlug);
        })
        .catch((error) => {
          console.error("Failed to auto-switch workspace:", error);
        });
    }
  }, [workspaceSlug, activeWorkspace, isLoading]);

  // Update active workspace mutation
  const {
    mutateAsync: updateActiveWorkspaceMutation,
    isPending: isSwitchingWorkspace,
  } = useMutation({
    mutationFn: async ({
      workspaceSlug,
      newWorkspace,
    }: {
      workspaceSlug: string;
      newWorkspace?: Partial<PartialWorkspace>;
    }) => {
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

      // Update the active organization in Better Auth
      await organization.setActive({
        organizationSlug: workspaceSlug,
      });

      // Set last visited workspace to cookies
      setLastVisitedWorkspace(workspaceSlug);

      // Fetch full workspace data
      const response = await request<ActiveOrganization>(
        `workspaces/${workspaceSlug}`,
      );
      if (!response.data) {
        throw new Error("Workspace not found");
      }

      return response.data;
    },
    onSuccess: (data) => {
      setActiveWorkspace(data);
      // Update the React Query cache
      queryClient.setQueryData(["workspace", data.slug], data);
    },
    onError: (error) => {
      console.error("Failed to switch workspace:", error);
      // Revert optimistic update
      if (initialWorkspace) {
        setActiveWorkspace(initialWorkspace);
      }
    },
  });

  async function updateActiveWorkspace(
    workspaceSlug: string,
    newWorkspace?: Partial<PartialWorkspace>,
  ) {
    await updateActiveWorkspaceMutation({ workspaceSlug, newWorkspace });
  }

  const isFetchingWorkspace = isLoading || isSwitchingWorkspace;
  const isOwner = activeWorkspace?.currentUserRole === "owner";
  const isAdmin = activeWorkspace?.currentUserRole === "admin";
  const isMember = activeWorkspace?.currentUserRole === "member";
  const currentUserRole = activeWorkspace?.currentUserRole || null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        updateActiveWorkspace,
        isFetchingWorkspace,
        workspaceList: workspaces.data,
        isOwner,
        isAdmin,
        isMember,
        currentUserRole,
      }}
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
