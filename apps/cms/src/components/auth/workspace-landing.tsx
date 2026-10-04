"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageLoader from "@/components/shared/page-loader";
import { useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { getLastVisitedWorkspace } from "@/utils/workspace/client";

export function WorkspaceLanding() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  // The same query WorkspaceProvider reads, so the workspace page that this
  // redirects to finds the list already cached. Only verified users can call it.
  const isVerified = Boolean(session?.user.emailVerified);
  const {
    data: workspaces,
    isPending: isWorkspacePending,
    error,
  } = useQuery({
    ...orpc.workspaces.list.queryOptions(),
    enabled: isVerified,
  });

  useEffect(() => {
    if (isSessionPending) {
      return;
    }
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    if (!session.user.emailVerified) {
      router.replace(`/verify?email=${encodeURIComponent(session.user.email)}`);
      return;
    }
    if (isWorkspacePending || error) {
      return;
    }
    const lastVisited = getLastVisitedWorkspace();
    const workspace =
      workspaces?.find((entry) => entry.slug === lastVisited) ??
      workspaces?.[0];
    router.replace(workspace ? `/${workspace.slug}` : "/new");
  }, [
    error,
    isSessionPending,
    isWorkspacePending,
    router,
    session,
    workspaces,
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return <PageLoader />;
}
