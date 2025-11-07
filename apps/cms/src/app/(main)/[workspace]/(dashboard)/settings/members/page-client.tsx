"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { columns, type TeamMemberRow } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteSection } from "@/components/team/invite-section";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";

const InviteModal = dynamic(() =>
  import("@/components/team/invite-modal").then((mod) => mod.InviteModal)
);

const LeaveWorkspaceModal = dynamic(() =>
  import("@/components/team/leave-workspace").then(
    (mod) => mod.LeaveWorkspaceModal
  )
);

function PageClient() {
  const { user } = useUser();
  const { activeWorkspace, isFetchingWorkspace, currentUserRole } =
    useWorkspace();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  if (isFetchingWorkspace || !activeWorkspace || !user) {
    return <PageLoader />;
  }

  const data: TeamMemberRow[] = activeWorkspace.members.map((member) => ({
    id: member.id,
    type: "member" as const,
    name: member.user.name || member.user.email,
    email: member.user.email,
    image: member.user.image || null,
    role: member.role as "owner" | "admin" | "member",
    status: "accepted" as const,
    joinedAt: new Date(member.createdAt),
    userId: member.userId,
  }));

  console.log("invitations", activeWorkspace.invitations);

  return (
    <WorkspacePageWrapper>
      <div className="space-y-6">
        <TeamDataTable
          columns={columns}
          currentUserId={user.id}
          currentUserRole={
            currentUserRole as "owner" | "admin" | "member" | undefined
          }
          data={data}
          setShowInviteModal={setShowInviteModal}
          setShowLeaveWorkspaceModal={setShowLeaveWorkspaceModal}
        />

        <InviteSection invitations={activeWorkspace.invitations || []} />
      </div>

      <InviteModal open={showInviteModal} setOpen={setShowInviteModal} />
      <LeaveWorkspaceModal
        id={activeWorkspace.id}
        name={activeWorkspace.name}
        open={showLeaveWorkspaceModal}
        setOpen={setShowLeaveWorkspaceModal}
      />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
