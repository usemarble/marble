"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import NotFound from "@/app/not-found";
import PageLoader from "@/components/shared/page-loader";
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
 * It also keeps Better Auth's active organization on the URL's workspace, which
 * the organization endpoints (members, invitations) default to.
 */
export function WorkspaceProvider({
  children,
  workspaceSlug,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
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
      isSwitchingWorkspace ||
      !(workspaceId && session) ||
      activeOrganizationId === workspaceId
    ) {
      return;
    }
    organization
      .setActive({ organizationId: workspaceId })
      .then(({ error: setActiveError }) => {
        if (setActiveError) {
          toast.error(setActiveError.message || "Failed to activate workspace");
        }
      })
      .catch((setActiveError) => {
        console.error("Failed to activate workspace", setActiveError);
      });
  }, [activeOrganizationId, isSwitchingWorkspace, session, workspaceId]);

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

      setIsSwitchingWorkspace(true);
      setLastVisitedWorkspace(workspace.slug);

      // Preserve the path after the workspace slug,
      // e.g. /old/posts/123 → /new/posts/123
      const pathAfterWorkspace = pathname.split("/").filter(Boolean).slice(1);
      router.push(workspacePath(workspace.slug, pathAfterWorkspace.join("/")));
      return Promise.resolve();
    },
    [pathname, router]
  );

  const refreshActiveWorkspace = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (error && !workspaceList) {
    throw error;
  }

  if (!workspaceList || (isMissing && recheckedSlug !== workspaceSlug)) {
    return <PageLoader />;
  }

  if (!activeWorkspace) {
    return isFetching ? <PageLoader /> : <NotFound />;
  }

  const isFetchingWorkspace =
    isSwitchingWorkspace || !session || activeOrganizationId !== workspaceId;
  const currentUserRole = activeWorkspace.currentUserRole;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        updateActiveWorkspace,
        refreshActiveWorkspace,
        isFetchingWorkspace,
        workspaceList,
        isOwner: currentUserRole === "owner",
        isAdmin: currentUserRole === "admin",
        isMember: currentUserRole === "member",
        currentUserRole,
      }}
    >
      {isFetchingWorkspace ? <PageLoader /> : children}
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
