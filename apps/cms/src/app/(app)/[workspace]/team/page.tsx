import { getWorkspaceMembers } from "@/lib/queries/team";
import React from "react";
import PageClient from "./page-client";

async function Page({ params }: { params: { workspace: string } }) {
  const { members, invites } = await getWorkspaceMembers(params.workspace);

  return (
    <PageClient
      members={members}
      invites={invites}
      workspaceId={params.workspace}
    />
  );
}

export default Page;
