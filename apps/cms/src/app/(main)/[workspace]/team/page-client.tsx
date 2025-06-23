"use client";

import { useState } from "react";
import WorkspaceWrapper from "@/components/layout/workspace-wrapper";
import { columns } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteModal } from "@/components/team/invite-modal";
import { LeaveWorkspaceModal } from "@/components/team/leave-workspace";
import type { ActiveOrganization, Session } from "@/lib/auth/types";

interface PageClientProps {
  activeOrganization: ActiveOrganization | null;
  session: Session | null;
}

function PageClient(props: PageClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [optimisticOrg, setOptimisticOrg] = useState<ActiveOrganization | null>(
    props.activeOrganization,
  );
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  const currentUserMemberInfo = optimisticOrg?.members.find(
    (member) => member.userId === props.session?.user.id,
  );
  const currentUserRole = currentUserMemberInfo?.role;

  const data = [
    ...(optimisticOrg?.members.map((member) => ({
      id: member.id,
      type: "member" as const,
      name: member.user.name || member.user.email,
      email: member.user.email,
      image: member.user.image || null,
      role: member.role,
      status: "accepted" as const,
      inviterId: null,
      expiresAt: null,
      joinedAt: member.createdAt,
    })) || []),
    ...(optimisticOrg?.invitations
      .filter((invitation) => invitation.status === "pending")
      .map((invitation) => ({
        id: invitation.id,
        type: "invite" as const,
        name: null,
        email: invitation.email,
        image: null,
        role: invitation.role,
        status: invitation.status,
        inviterId: invitation.inviterId,
        expiresAt: invitation.expiresAt,
      })) || []),
  ];

  return (
    <WorkspaceWrapper>
      <TeamDataTable
        columns={columns}
        data={data}
        currentUserRole={currentUserRole}
        currentUserId={props.session?.user.id}
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
    </WorkspaceWrapper>
  );
}

export default PageClient;
