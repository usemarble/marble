"use client";

import { Card, CardContent, CardHeader } from "@marble/ui/components/card";
import { Skeleton } from "@marble/ui/components/skeleton";
import { useEffect, useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { columns } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteModal } from "@/components/team/invite-modal";
import { LeaveWorkspaceModal } from "@/components/team/leave-workspace";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";

type UserRole = "owner" | "admin" | "member" | undefined;

function PageClient() {
  const { user, isAuthenticated, isFetchingUser } = useUser();
  const { activeWorkspace, isFetchingWorkspace } = useWorkspace();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [optimisticOrg, setOptimisticOrg] = useState(activeWorkspace);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  // Update optimistic org when activeWorkspace changes
  useEffect(() => {
    setOptimisticOrg(activeWorkspace);
  }, [activeWorkspace]);

  if (!isAuthenticated || isFetchingUser) {
    return (
      <WorkspacePageWrapper>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </WorkspacePageWrapper>
    );
  }

  if (isFetchingWorkspace || !activeWorkspace || !user) {
    return (
      <WorkspacePageWrapper>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </WorkspacePageWrapper>
    );
  }

  // Convert workspace role to expected UserRole type
  const currentUserRole: UserRole = user.workspaceRole as UserRole;

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
      userId: member.userId,
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
        userId: null,
      })) || []),
  ];

  return (
    <WorkspacePageWrapper>
      <TeamDataTable
        columns={columns}
        data={data}
        currentUserRole={currentUserRole}
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
