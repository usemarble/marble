import type { PlanType, SubscriptionStatus } from "@marble/drizzle";
import { getWorkspacePlan } from "@/lib/plans";
import type { Workspace } from "@/types/workspace";

type SubscriptionRow = {
  id: string;
  status: SubscriptionStatus;
  plan: PlanType;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
};

export type WorkspaceWithRelations = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  createdAt: Date;
  members: Workspace["members"];
  invitations?: Workspace["invitations"];
  subscriptions: SubscriptionRow[];
};

export function mapWorkspaceToView(
  foundWorkspace: WorkspaceWithRelations,
  currentUserId: string
): Workspace | null {
  const currentUserMember = foundWorkspace.members.find(
    (entry) => entry.userId === currentUserId
  );

  if (!currentUserMember) {
    return null;
  }

  const activeSubscription = foundWorkspace.subscriptions[0] ?? null;
  const activePlan = getWorkspacePlan(activeSubscription);

  return {
    id: foundWorkspace.id,
    name: foundWorkspace.name,
    slug: foundWorkspace.slug,
    logo: foundWorkspace.logo,
    timezone: foundWorkspace.timezone,
    createdAt: foundWorkspace.createdAt,
    members: foundWorkspace.members,
    invitations: foundWorkspace.invitations,
    currentUserRole: currentUserMember.role ?? null,
    subscription: activeSubscription
      ? {
          ...activeSubscription,
          activePlan,
        }
      : null,
  };
}

export function mapWorkspaceListItem(
  foundWorkspace: WorkspaceWithRelations,
  currentUserId: string
) {
  return mapWorkspaceToView(foundWorkspace, currentUserId);
}
