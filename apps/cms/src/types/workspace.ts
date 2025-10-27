export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string | null;
  createdAt: Date | string;
  currentUserRole: string | null;
  members: Array<{
    id: string;
    role: string;
    organizationId: string;
    createdAt: Date | string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  invitations?: Array<{
    id: string;
    email: string;
    role: string | null;
    status: string;
    organizationId: string;
    inviterId: string;
    expiresAt: Date | string;
  }>;
  subscription: {
    id: string;
    status: string;
    plan: string;
    currentPeriodStart?: string | Date;
    currentPeriodEnd?: string | Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: string | Date | null;
  } | null;
  ai: {
    enabled: boolean;
  } | null;
};

export type WorkspaceContextType = {
  activeWorkspace: Workspace | null;
  updateActiveWorkspace: (workspace: Partial<Workspace>) => Promise<void>;
  workspaceList: Workspace[] | null;
  isFetchingWorkspace: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  currentUserRole: string | null;
};

export type WorkspaceProviderProps = {
  children: React.ReactNode;
  initialWorkspace: Workspace | null;
  workspaceSlug: string;
};
