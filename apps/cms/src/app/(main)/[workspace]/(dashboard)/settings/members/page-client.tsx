"use client";

import { PRICING_PLANS } from "@marble/utils";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { PlanLimitBanner } from "@/components/billing/plan-limit-banner";
import { DashboardBody } from "@/components/layout/wrapper";
import { columns, type TeamMemberRow } from "@/components/team/columns";
import { TeamDataTable } from "@/components/team/data-table";
import { InviteSection } from "@/components/team/invite-section";
import { usePlan } from "@/hooks/use-plan";
import { orpc } from "@/lib/orpc";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";
import Loading from "./loading";

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
  const { activeWorkspace, currentUserRole, isOwner } = useWorkspace();
  const { currentPlan, planLimits, currentMemberCount } = usePlan();
  const workspaceId = activeWorkspace?.id ?? "";

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false);

  const { data: members, error: membersError } = useQuery(
    orpc.workspaces.members.list.queryOptions({
      input: { workspaceId },
      enabled: Boolean(workspaceId),
    })
  );
  const { data: invitations, error: invitationsError } = useQuery(
    orpc.workspaces.invitations.list.queryOptions({
      input: { workspaceId },
      enabled: Boolean(workspaceId),
    })
  );

  const error = membersError ?? invitationsError;
  if (error) {
    return (
      <DashboardBody size="compact">
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </DashboardBody>
    );
  }

  if (!(activeWorkspace && user && members && invitations)) {
    return <Loading />;
  }

  const data: TeamMemberRow[] = members.map((member) => ({
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
  const pendingInviteCount = invitations.filter(
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

        <InviteSection invitations={invitations} workspaceId={workspaceId} />
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
