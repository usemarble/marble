import { db } from "@marble/db";
import { invitation, member, subscription } from "@marble/db/schema";
import { getWorkspacePlan, PLAN_LIMITS, type PlanType } from "@marble/utils";
import { APIError } from "better-auth/api";
import { and, count, desc, eq, gt, inArray } from "drizzle-orm";

/**
 * Newest subscription that could still be granting a paid plan.
 *
 * The SQL only narrows candidates - `getWorkspacePlan` makes the entitlement
 * decision, so the period and grace rules live in exactly one place.
 */
async function findLatestSubscription(workspaceId: string) {
  const found = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.workspaceId, workspaceId),
      inArray(subscription.status, ["active", "trialing", "canceled"])
    ),
    orderBy: desc(subscription.createdAt),
    columns: {
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  });

  return found ?? null;
}

export async function getWorkspacePlanType(
  workspaceId: string
): Promise<PlanType> {
  return getWorkspacePlan(await findLatestSubscription(workspaceId));
}

/**
 * Seats the workspace may occupy on its current plan.
 *
 * Wired into the organization plugin's `membershipLimit`, which Better Auth
 * enforces when an invitation is accepted and when a member is added directly.
 */
export async function getWorkspaceMembershipLimit(
  workspaceId: string
): Promise<number> {
  const plan = await getWorkspacePlanType(workspaceId);
  return PLAN_LIMITS[plan].maxMembers;
}

/**
 * Blocks an invitation the workspace has no seat for.
 *
 * Pending invitations count against the cap alongside members: without that, a
 * workspace on its last seat could send any number of invitations that each
 * pass this check individually and then all be accepted.
 */
export async function guardWorkspaceInviteSeat(workspaceId: string) {
  const plan = await getWorkspacePlanType(workspaceId);
  const limits = PLAN_LIMITS[plan];

  if (!limits.features.inviteMembers) {
    throw new APIError("FORBIDDEN", {
      message: "Upgrade your plan to invite team members",
    });
  }

  const [memberRows, invitationRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(member)
      .where(eq(member.organizationId, workspaceId)),
    db
      .select({ value: count() })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, workspaceId),
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date())
        )
      ),
  ]);

  const seatsTaken =
    (memberRows[0]?.value ?? 0) + (invitationRows[0]?.value ?? 0);

  if (seatsTaken >= limits.maxMembers) {
    throw new APIError("FORBIDDEN", {
      message: `Your ${plan} plan includes ${limits.maxMembers} team member${
        limits.maxMembers === 1 ? "" : "s"
      }. Upgrade to add more.`,
    });
  }
}
