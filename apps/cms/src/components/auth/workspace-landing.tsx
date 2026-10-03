"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageLoader from "@/components/shared/page-loader";
import { useListOrganizations, useSession } from "@/lib/auth/client";
import { getLastVisitedWorkspace } from "@/utils/workspace/client";

export function WorkspaceLanding() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const {
    data: workspaces,
    isPending: isWorkspacePending,
    error,
  } = useListOrganizations();

  useEffect(() => {
    if (isSessionPending || isWorkspacePending || error) {
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
