"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { usePathname, useRouter } from "next/navigation";
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
}: WorkspaceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    initialWorkspace
  );
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

  const { data: usersWorkspaces } = useQuery({
    queryKey: QUERY_KEYS.WORKSPACE_LIST,
    queryFn: async () => {
      const response = await request<Workspace[]>("workspaces");
      return response.data;
    },
  });

  const { mutateAsync: updateActiveWorkspaceMutation } = useMutation({
    mutationFn: async (workspace: Partial<Workspace>) => {
      setIsSwitchingWorkspace(true);

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
    onSuccess: (_data, workspace) => {
      if (workspace.slug) {
        const isWorkspaceScopedQuery = (queryKey: readonly unknown[]) =>
          Array.isArray(queryKey) &&
          queryKey.length > 0 &&
          typeof queryKey[0] === "string" &&
          WORKSPACE_SCOPED_PREFIXES.includes(
            queryKey[0] as WorkspaceScopedPrefix
          );

        queryClient.cancelQueries({
          predicate: (query) => isWorkspaceScopedQuery(query.queryKey),
        });
        queryClient.removeQueries({
          predicate: (query) => isWorkspaceScopedQuery(query.queryKey),
        });

        // Preserve the path after the workspace slug
        // e.g., /oldworkspace/posts/123 → /newworkspace/posts/123
        const pathSegments = pathname.split("/").filter(Boolean);
        const pathAfterWorkspace = pathSegments.slice(1).join("/");
        const newPath = pathAfterWorkspace
          ? `/${workspace.slug}/${pathAfterWorkspace}`
          : `/${workspace.slug}`;

        router.push(newPath);
      }
    },
    onError: (error: AxiosError) => {
      console.error("Failed to switch workspace:", error);
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
    setActiveWorkspace(initialWorkspace);
    setIsSwitchingWorkspace(false);
  }, [initialWorkspace]);

  const isFetchingWorkspace = isSwitchingWorkspace;
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
