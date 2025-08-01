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
import { QUERY_KEYS } from "@/lib/queries/keys";
import type {
  Workspace,
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    initialWorkspace,
  );
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

  const workspaceSlug = Array.isArray(params.workspace)
    ? params.workspace[0]
    : params.workspace;

  const shouldFetchWorkspace =
    !!workspaceSlug &&
    (!activeWorkspace || activeWorkspace.slug !== workspaceSlug);

  const { data: usersWorkspaces } = useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES],
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
      }
      if (response.status === 404) {
        throw new Error("Workspace not found");
      }
      return response.data;
    } catch (error) {
      console.error("Failed to fetch workspace data:", error);
      return null;
    }
  };

  const { data: fetchedActiveWorkspace, isLoading: isFetchingActiveWorkspace } =
    useQuery({
      queryKey: QUERY_KEYS.WORKSPACE(workspaceSlug),
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
      setActiveWorkspace(
        (prev) =>
          ({
            ...prev,
            ...workspace,
          }) as Workspace,
      );

      if (workspace.slug) {
        setLastVisitedWorkspace(workspace.slug);
      }

      const { data, error } = await organization.setActive({
        organizationId: workspace.id,
      });

      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.clear();
        queryClient.setQueryData(QUERY_KEYS.WORKSPACE(data.slug), data);
        router.push(`/${data.slug}`);
      }
      setIsSwitchingWorkspace(false);
    },
    onError: (error: AxiosError) => {
      console.error("Failed to switch workspace:", error);
      if (initialWorkspace) {
        setActiveWorkspace(initialWorkspace);
        setLastVisitedWorkspace(initialWorkspace.slug);
      }
      setIsSwitchingWorkspace(false);
    },
  });

  const updateActiveWorkspace = useCallback(
    async (workspace: Partial<Workspace>) => {
      await updateActiveWorkspaceMutation(workspace);
    },
    [updateActiveWorkspaceMutation],
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
