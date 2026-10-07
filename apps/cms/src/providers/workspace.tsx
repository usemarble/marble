"use client";

import { toast } from "@marble/ui/components/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import NotFound from "@/app/not-found";
import { organization, useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import type {
  Workspace,
  WorkspaceContextType,
  WorkspaceProviderProps,
} from "@/types/workspace";
import { setLastVisitedWorkspace } from "@/utils/workspace/client";
import { workspacePath } from "@/utils/workspace/url";

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

/**
 * Resolves the workspace named by the URL against the user's workspaces
 * (`workspaces.list`) and provides it to the dashboard. The Worker authorizes
 * every call against the `workspaceId` the components pass, so this decides
 * nothing about access: a slug that isn't in the list just isn't one of theirs.
 *
 * Children render straight away. Until the list arrives `activeWorkspace` is
 * null and each page shows its own route skeleton; nothing waits for the
 * active organization to sync, because every query passes `workspaceId` and
 * every Better Auth organization call passes `organizationId`. Only a slug
 * that isn't the user's replaces the dashboard, with a 404.
 *
 * It also keeps Better Auth's active organization on the URL's workspace, for
 * the calls that still default to it (accepting an invitation, creating a
 * workspace).
 */
export function WorkspaceProvider({
  children,
  workspaceSlug,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { data: session } = useSession();
  const activationPaused = useRef(false);
  const activationRequests = useRef(new Set<Promise<void>>());
  const [isRemovingWorkspace, setIsRemovingWorkspace] = useState(false);
  const [recheckedSlug, setRecheckedSlug] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );

  const {
    data: workspaceList,
    error,
    isFetching,
    refetch,
  } = useQuery(orpc.workspaces.list.queryOptions());

  // Keep the last workspace seen for this URL. Leaving or deleting a workspace
  // refetches the list without it before the redirect lands, and the page
  // shouldn't turn into a 404 in between.
  const found = workspaceList?.find((entry) => entry.slug === workspaceSlug);
  if (found && found !== activeWorkspace) {
    setActiveWorkspace(found);
  }

  // A workspace created or joined a moment ago may be missing from a cached
  // list, so one miss refetches before the URL is treated as not found.
  const isMissing = Boolean(workspaceList) && !activeWorkspace;
  useEffect(() => {
    if (isMissing && !isFetching && recheckedSlug !== workspaceSlug) {
      setRecheckedSlug(workspaceSlug);
      refetch();
    }
  }, [isFetching, isMissing, recheckedSlug, refetch, workspaceSlug]);

  const workspaceId = activeWorkspace?.id;
  const activeOrganizationId = session?.session.activeOrganizationId;

  useEffect(() => {
    if (
      isRemovingWorkspace ||
      activationPaused.current ||
      !(workspaceId && session) ||
      activeOrganizationId === workspaceId
    ) {
      return;
    }

    let cancelled = false;
    const request = organization
      .setActive({ organizationId: workspaceId })
      .then(({ error: setActiveError }) => {
        if (setActiveError && !cancelled && !activationPaused.current) {
          toast.error(setActiveError.message || "Failed to activate workspace");
        }
      })
      .catch((setActiveError) => {
        if (!cancelled && !activationPaused.current) {
          console.error("Failed to activate workspace", setActiveError);
        }
      })
      .finally(() => {
        activationRequests.current.delete(request);
      });
    activationRequests.current.add(request);

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, isRemovingWorkspace, session, workspaceId]);

  const removeWorkspace = useCallback(
    async (organizationId: string, action: "delete" | "leave") => {
      if (activationPaused.current) {
        throw new Error("A workspace removal is already in progress");
      }

      // Pause immediately, before React renders or Better Auth refreshes the
      // session. Drain requests already sent so none can finish after removal.
      activationPaused.current = true;
      setIsRemovingWorkspace(true);

      try {
        await Promise.all(activationRequests.current);
        const { error: removalError } = await organization[action]({
          organizationId,
        });
        if (removalError) {
          throw new Error(removalError.message || "Failed to remove workspace");
        }
      } catch (removalError) {
        activationPaused.current = false;
        setIsRemovingWorkspace(false);
        throw removalError;
      }

      // Keep activation paused until the outgoing provider unmounts. Its last
      // workspace stays visible while the list refreshes and navigation lands.
      queryClient.invalidateQueries({
        queryKey: orpc.workspaces.list.key(),
      });
      const nextWorkspace = workspaceList?.find(
        (workspace) => workspace.id !== organizationId
      );
      if (nextWorkspace) {
        setLastVisitedWorkspace(nextWorkspace.slug);
      }
      router.replace(
        nextWorkspace ? workspacePath(nextWorkspace.slug) : "/new"
      );
    },
    [queryClient, router, workspaceList]
  );

  useEffect(() => {
    if (activeWorkspace) {
      setLastVisitedWorkspace(activeWorkspace.slug);
    }
  }, [activeWorkspace]);

  // Switching is a navigation: the destination's provider syncs the active
  // organization, and every query is keyed by workspace ID, so there is nothing
  // to cancel or clear here.
  const updateActiveWorkspace = useCallback(
    (workspace: Partial<Workspace>) => {
      if (!workspace.slug) {
        return Promise.reject(new Error("Workspace slug is required"));
      }

      setLastVisitedWorkspace(workspace.slug);

      // Preserve the path after the workspace slug,
      // e.g. /old/posts/123 → /new/posts/123
      const pathAfterWorkspace = pathname.split("/").filter(Boolean).slice(1);
      router.push(workspacePath(workspace.slug, pathAfterWorkspace.join("/")));
      return Promise.resolve();
    },
    [pathname, router]
  );

  if (error && !workspaceList) {
    throw error;
  }

  // The list has been refetched once since the slug went missing and it is
  // still not there: it isn't one of the user's workspaces.
  if (isMissing && recheckedSlug === workspaceSlug && !isFetching) {
    return <NotFound />;
  }

  const currentUserRole = activeWorkspace?.currentUserRole ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        removeWorkspace,
        updateActiveWorkspace,
        workspaceList: workspaceList ?? null,
        isOwner: currentUserRole === "owner",
        isAdmin: currentUserRole === "admin",
        isMember: currentUserRole === "member",
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
