"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { UsersIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { columns, type TeamMemberRow } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteSection } from "@/components/team/invite-section";
import { usePlan } from "@/hooks/use-plan";
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
  const { isHobbyPlan } = usePlan();

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
    <WorkspacePageWrapper size="compact">
      {isHobbyPlan ? (
        <div className="grid h-full place-content-center">
          <div className="flex max-w-84 flex-col items-center gap-4">
            <div className="p-2">
              <UsersIcon className="size-16" />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <p className="font-medium">
                  To add team members upgrade to a pro plan
                </p>
                <p className="text-muted-foreground text-sm">
                  You can try it free for 3 days.
                </p>
              </div>
              <Link
                className={buttonVariants({ variant: "default" })}
                href={`/${activeWorkspace.slug}/settings/billing`}
              >
                Go to Billing
              </Link>
            </div>
          </div>
        </div>
      ) : (
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
      )}

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
