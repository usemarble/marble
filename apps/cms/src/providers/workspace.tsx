"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { notFound, usePathname, useRouter } from "next/navigation";
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
import { setLastVisitedWorkspace } from "@/utils/workspace/client";

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({
  children,
  initialWorkspace,
  workspaceSlug,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    initialWorkspace
  );
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

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
        return notFound();
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
      queryKey: QUERY_KEYS.WORKSPACE_BY_SLUG(workspaceSlug),
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
        toast.error(error.message);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey;
            // Remove workspace-scoped queries
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
        queryClient.setQueryData(QUERY_KEYS.WORKSPACE_BY_SLUG(data.slug), data);
        queryClient.setQueryData(QUERY_KEYS.WORKSPACE(data.id), data);

        // Preserve the path after the workspace slug
        // e.g., /oldworkspace/posts/123 → /newworkspace/posts/123
        const pathSegments = pathname.split("/").filter(Boolean);
        const pathAfterWorkspace = pathSegments.slice(1).join("/");
        const newPath = pathAfterWorkspace
          ? `/${data.slug}/${pathAfterWorkspace}`
          : `/${data.slug}`;

        router.push(newPath);
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
