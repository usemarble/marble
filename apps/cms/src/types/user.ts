import type { RouterInputs, RouterOutputs } from "@marble/api/routers";

/** The signed-in user, as `me.get` returns it. */
export type UserProfile = RouterOutputs["me"]["get"];

export interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isFetchingUser: boolean;
  updateUser: (updates: RouterInputs["me"]["update"]) => Promise<void>;
  isUpdatingUser: boolean;
  signOut: () => Promise<void>;
  isSigningOut: boolean;
}
