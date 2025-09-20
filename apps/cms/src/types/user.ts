import type { User } from "better-auth";

export interface UserProfile extends Omit<User, "emailVerified"> {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  workspaceRole: string | null;
  // accountId: string | null;
  activeWorkspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export type UserContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isFetchingUser: boolean;
  updateUser: (
    updates: Partial<Pick<UserProfile, "name" | "image">>
  ) => Promise<void>;
  isUpdatingUser: boolean;
  signOut: () => Promise<void>;
  isSigningOut: boolean;
};
