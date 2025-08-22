"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { columns, type TeamMemberRow } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { PageLoader } from "@/components/ui/loader";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";

const InviteModal = dynamic(() =>
  import("@/components/team/invite-modal").then((mod) => mod.InviteModal),
);

const LeaveWorkspaceModal = dynamic(() =>
  import("@/components/team/leave-workspace").then(
    (mod) => mod.LeaveWorkspaceModal,
  ),
);

function PageClient() {
  const { user, isAuthenticated, isFetchingUser } = useUser();
  const { activeWorkspace, isFetchingWorkspace, currentUserRole } =
    useWorkspace();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [optimisticOrg, setOptimisticOrg] = useState(activeWorkspace);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  // Update optimistic org when activeWorkspace changes
  useEffect(() => {
    setOptimisticOrg(activeWorkspace);
  }, [activeWorkspace]);

  if (!isAuthenticated || isFetchingUser) {
    return <PageLoader />;
  }

  if (isFetchingWorkspace || !activeWorkspace || !user) {
    return <PageLoader />;
  }

  const data: TeamMemberRow[] = [
    ...(optimisticOrg?.members.map((member) => ({
      id: member.id,
      type: "member" as const,
      name: member.user.name || member.user.email,
      email: member.user.email,
      image: member.user.image || null,
      role: member.role as "owner" | "admin" | "member",
      status: "accepted" as const,
      inviterId: null,
      expiresAt: null,
      joinedAt: new Date(member.createdAt),
      userId: member.userId,
    })) || []),
    ...(optimisticOrg?.invitations
      ?.filter((invitation) => invitation.status === "pending")
      .map((invitation) => ({
        id: invitation.id,
        type: "invite" as const,
        name: null,
        email: invitation.email,
        image: null,
        role: (invitation.role as "owner" | "admin" | "member") || "member",
        status: invitation.status as "pending",
        inviterId: invitation.inviterId,
        expiresAt: new Date(invitation.expiresAt),
        userId: null,
        joinedAt: null,
      })) || []),
  ];

  return (
    <WorkspacePageWrapper>
      <TeamDataTable
        columns={columns}
        data={data}
        currentUserRole={
          currentUserRole as "owner" | "admin" | "member" | undefined
        }
        currentUserId={user.id}
        setShowInviteModal={setShowInviteModal}
        setShowLeaveWorkspaceModal={setShowLeaveWorkspaceModal}
      />
      <InviteModal
        open={showInviteModal}
        setOpen={setShowInviteModal}
        setOptimisticOrg={setOptimisticOrg}
      />
      <LeaveWorkspaceModal
        id={optimisticOrg?.id || ""}
        name={optimisticOrg?.name || ""}
        open={showLeaveWorkspaceModal}
        setOpen={setShowLeaveWorkspaceModal}
      />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
