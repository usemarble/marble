import { getWorkspaceMembers } from "@/lib/queries/team";
import React from "react";
import PageClient from "./page-client";

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const { members, invites } = await getWorkspaceMembers(workspace);

  return (
    <PageClient members={members} invites={invites} workspaceId={workspace} />
  );
}

export default Page;
