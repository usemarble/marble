import type { WorkspaceWithRole } from "@/hooks/use-user-workspace";
import type { ActiveOrganization } from "@/lib/auth/types";

// Type for partial workspace data that doesn't require full member details
// This is because the response from creating a workspace doesn't return what is fully expected by the ActiveOrganization type
// So we set it like this and then fetch the full data after
export type PartialWorkspace = Omit<ActiveOrganization, "members"> & {
  members: Array<{
    id: string;
    createdAt: Date;
    userId: string;
    organizationId: string;
    role: string;
    teamId?: string;
  }>;
  subscription?: {
    id: string;
    status: string;
    plan: string;
  } | null;
};

// Extended workspace type with subscription and role info
export type ExtendedWorkspace = ActiveOrganization & {
  subscription?: {
    id: string;
    status: string;
    plan: string;
    currentPeriodStart: string | Date;
    currentPeriodEnd: string | Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: string | Date | null;
  } | null;
  currentUserRole?: string | null;
};

// Context type for workspace provider
export type ActiveWorkspace = ExtendedWorkspace | null;

export interface WorkspaceContextType {
  activeWorkspace: ActiveWorkspace;
  updateActiveWorkspace: (
    workspaceSlug: string,
    newWorkspace?: Partial<PartialWorkspace>,
  ) => Promise<void>;
  workspaceList: WorkspaceWithRole[] | null;
  isFetchingWorkspace: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  currentUserRole: string | null;
}

// Props for workspace provider
export interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspace: ActiveOrganization | null;
}
