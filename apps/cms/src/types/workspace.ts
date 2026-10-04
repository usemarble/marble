import type { RouterOutputs } from "@marble/api/routers";

/** A workspace the user belongs to, as `workspaces.list` returns it. */
export type Workspace = RouterOutputs["workspaces"]["list"][number];

export interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  updateActiveWorkspace: (workspace: Partial<Workspace>) => Promise<void>;
  /**
   * Better Auth's active organization is this workspace. Only the dashboard
   * routes still on the CMS wait for it; see `useSyncedWorkspaceId`.
   */
  isOrganizationSynced: boolean;
  workspaceList: Workspace[] | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  currentUserRole: string | null;
}

export interface WorkspaceProviderProps {
  children: React.ReactNode;
  workspaceSlug: string;
}
