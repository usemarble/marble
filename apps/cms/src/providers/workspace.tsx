"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { organization } from "@/lib/auth/client";
import {
  WORKSPACE_SCOPED_PREFIXES,
  type WorkspaceScopedPrefix,
} from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type {
  Workspace,
  WorkspaceContextType,
  WorkspaceProviderProps,
} from "@/types/workspace";
import { request } from "@/utils/fetch/client";
import { setLastVisitedWorkspace } from "@/utils/workspace";

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({
  children,
  initialWorkspace,
}: WorkspaceProviderProps) {
  const params = useParams<{ workspace: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    initialWorkspace
  );
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(null);

  const workspaceSlug = Array.isArray(params.workspace)
    ? params.workspace[0]
    : params.workspace;

  const shouldFetchWorkspace =
    !!workspaceSlug &&
    (!activeWorkspace || activeWorkspace.slug !== workspaceSlug);

  const { data: usersWorkspaces } = useQuery({
    queryKey: QUERY_KEYS.WORKSPACE_LIST,
    queryFn: async () => {
      const response = await request<Workspace[]>("workspaces");
      return response.data;
    },
  });

  const fetchWorkspaceData = async (slug: string) => {
    try {
      const response = await request<Workspace>(`workspaces/${slug}`);
      if (response.status === 200) {
        setActiveWorkspace(response.data);
        return response.data;
      }
      if (response.status === 404) {
        console.error("Workspace not found");
        return null;
      }
      console.error(`Unexpected status code: ${response.status}`);
      return null;
    } catch (error) {
      console.error("Failed to fetch workspace data:", error);
      return null;
    }
  };

  const { data: fetchedActiveWorkspace, isLoading: isFetchingActiveWorkspace } =
    useQuery({
      queryKey: ["workspace_by_slug", workspaceSlug],
      queryFn: () => fetchWorkspaceData(workspaceSlug),
      enabled: shouldFetchWorkspace,
      initialData:
        initialWorkspace && initialWorkspace.slug === workspaceSlug
          ? initialWorkspace
          : undefined,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });

  const { mutateAsync: updateActiveWorkspaceMutation } = useMutation({
    mutationFn: async (workspace: Partial<Workspace>) => {
      setIsSwitchingWorkspace(true);

      // Store previous workspace for rollback
      const previousWorkspace = activeWorkspace;

      // Set pending workspace ID to signal that we're switching
      setPendingWorkspaceId(workspace.id || null);

      // Immediately cancel and remove all workspace-scoped queries to prevent stale data
      queryClient.cancelQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Cancel all workspace-scoped queries
          return (
            Array.isArray(key) &&
            key.length >= 2 &&
            typeof key[1] === "string" &&
            WORKSPACE_SCOPED_PREFIXES.includes(
              key[0] as WorkspaceScopedPrefix
            )
          );
        },
      });

      // Remove old workspace queries immediately
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Remove workspace-scoped queries for the old workspace
          return (
            Array.isArray(key) &&
            key.length >= 2 &&
            typeof key[1] === "string" &&
            previousWorkspace?.id &&
            key[1] === previousWorkspace.id &&
            WORKSPACE_SCOPED_PREFIXES.includes(
              key[0] as WorkspaceScopedPrefix
            )
          );
        },
      });

      // Optimistically set the new workspace immediately
      setActiveWorkspace(
        (prev) =>
          ({
            ...prev,
            ...workspace,
          }) as Workspace
      );

      if (workspace.slug) {
        setLastVisitedWorkspace(workspace.slug);
      }

      if (!workspace.id) {
        throw new Error("Workspace ID is required for switching");
      }

      const { data, error } = await organization.setActive({
        organizationId: workspace.id,
      });

      if (error) {
        // Rollback to previous workspace on error
        setActiveWorkspace(previousWorkspace);
        setPendingWorkspaceId(null);
        toast.error(error.message);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        // Clear pending workspace ID
        setPendingWorkspaceId(null);

        // Invalidate any remaining queries from all workspaces to ensure fresh data
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey;
            // Remove all workspace-scoped queries
            return (
              Array.isArray(key) &&
              key.length >= 2 &&
              typeof key[1] === "string" &&
              WORKSPACE_SCOPED_PREFIXES.includes(
                key[0] as WorkspaceScopedPrefix
              )
            );
          },
        });
        // Set new workspace data
        queryClient.setQueryData(["workspace_by_slug", data.slug], data);
        queryClient.setQueryData(QUERY_KEYS.WORKSPACE(data.id), data);
        router.push(`/${data.slug}`);
      }
      setIsSwitchingWorkspace(false);
    },
    onError: (error: AxiosError, variables, context) => {
      console.error("Failed to switch workspace:", error);
      // Error handling is done in mutationFn with rollback
      setPendingWorkspaceId(null);
      setIsSwitchingWorkspace(false);
    },
  });

  const updateActiveWorkspace = useCallback(
    async (workspace: Partial<Workspace>) => {
      await updateActiveWorkspaceMutation(workspace);
    },
    [updateActiveWorkspaceMutation]
  );

  useEffect(() => {
    if (
      fetchedActiveWorkspace &&
      workspaceSlug !== fetchedActiveWorkspace.slug &&
      !isSwitchingWorkspace
    ) {
      updateActiveWorkspace(fetchedActiveWorkspace);
    }
  }, [
    fetchedActiveWorkspace,
    workspaceSlug,
    isSwitchingWorkspace,
    updateActiveWorkspace,
  ]);

  const isFetchingWorkspace = isFetchingActiveWorkspace || isSwitchingWorkspace;
  const isOwner = activeWorkspace?.currentUserRole === "owner";
  const isAdmin = activeWorkspace?.currentUserRole === "admin";
  const isMember = activeWorkspace?.currentUserRole === "member";
  const currentUserRole = activeWorkspace?.currentUserRole || null;

  // Use pending workspace ID during switch to prevent stale queries
  const currentWorkspaceId = pendingWorkspaceId || activeWorkspace?.id || null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        updateActiveWorkspace,
        isFetchingWorkspace,
        workspaceList: usersWorkspaces ?? null,
        isOwner,
        isAdmin,
        isMember,
        currentUserRole,
        currentWorkspaceId,
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
