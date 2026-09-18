"use client";

import { PRICING_PLANS } from "@marble/utils";
import dynamic from "next/dynamic";
import { useState } from "react";
import { PlanLimitBanner } from "@/components/billing/plan-limit-banner";
import { DashboardBody } from "@/components/layout/wrapper";
import { MembersSettingsSkeleton } from "@/components/settings/loading-skeletons";
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
  const { activeWorkspace, isFetchingWorkspace, currentUserRole, isOwner } =
    useWorkspace();
  const { currentPlan, planLimits, currentMemberCount } = usePlan();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  if (isFetchingWorkspace || !activeWorkspace || !user) {
    return <MembersSettingsSkeleton />;
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

  const planName =
    PRICING_PLANS.find((plan) => plan.id === currentPlan)?.title ?? currentPlan;
  const seats = planLimits.maxMembers;
  const seatLabel = `${seats} member${seats === 1 ? "" : "s"}`;
  const pendingInviteCount = (activeWorkspace.invitations || []).filter(
    (invitation) => invitation.status === "pending"
  ).length;

  // Limits are enforced on growth, never by removing people a workspace already
  // has, so these explain the state rather than blocking anything.
  const isOverSeatLimit = currentMemberCount > seats;
  const hasUnacceptableInvites =
    !isOverSeatLimit && currentMemberCount >= seats && pendingInviteCount > 0;

  return (
    <DashboardBody size="compact">
      <div className="space-y-6">
        {isOverSeatLimit ? (
          <PlanLimitBanner
            canUpgrade={isOwner}
            description={`This workspace has ${currentMemberCount} members but the ${planName} plan includes ${seatLabel}. Everyone keeps their access, you just can't invite anyone new until you upgrade.`}
            title="You're over your plan's member limit"
            workspaceSlug={activeWorkspace.slug}
          />
        ) : null}
        {hasUnacceptableInvites ? (
          <PlanLimitBanner
            canUpgrade={isOwner}
            description={`The ${planName} plan includes ${seatLabel}, and they are all taken. Pending invitations can't be accepted until you upgrade or remove a member.`}
            title="No seats left for pending invitations"
            workspaceSlug={activeWorkspace.slug}
          />
        ) : null}

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
    </DashboardBody>
  );
}

export default PageClient;
