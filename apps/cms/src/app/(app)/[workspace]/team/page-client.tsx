"use client";

import { columns } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteModal } from "@/components/team/invite-modal";
import { LeaveWorkspaceModal } from "@/components/team/leave-workspace";
import { organization } from "@/lib/auth/client";
import type { ActiveOrganization, Session } from "@/lib/auth/types";
import { toast } from "@marble/ui/components/sonner";
import { useState } from "react";

interface PageClientProps {
  activeOrganization: ActiveOrganization | null;
  session: Session | null;
}

function PageClient(props: PageClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [optimisticOrg, setOptimisticOrg] = useState<ActiveOrganization | null>(
    props.activeOrganization,
  );
  const [isCancelingInvite, setIsCancelingInvite] = useState(false);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  const currentUserMemberInfo = optimisticOrg?.members.find(
    (member) => member.userId === props.session?.user.id,
  );
  const currentUserRole = currentUserMemberInfo?.role;

  const cancelInvite = async (inviteId: string) => {
    setIsCancelingInvite(true);
    try {
      await organization.cancelInvitation({
        invitationId: inviteId,
        fetchOptions: {
          onRequest: (ctx) => {
            toast.loading("Canceling invitation...", {
              id: "cancel-invite",
            });
          },
          onSuccess: (ctx) => {
            toast.success("Invitation canceled", {
              id: "cancel-invite",
            });
            setOptimisticOrg(
              (prev) =>
                prev && {
                  ...prev,
                  invitations: prev.invitations.filter(
                    (invite) => invite.id !== inviteId,
                  ),
                },
            );
          },
        },
      });
    } catch (error) {
      toast.error("Failed to cancel invitation", {
        id: "cancel-invite",
      });
    } finally {
      setIsCancelingInvite(false);
    }
  };

  const copyInviteLink = (inviteId: string) => {
    navigator.clipboard.writeText(
      `https://${process.env.NEXT_PUBLIC_APP_URL}/join/${inviteId}`,
    );
    toast.success("Invite link copied to clipboard");
  };

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
    <div className="max-w-4xl mx-auto py-8">
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
    </div>
  );
}

export default PageClient;
