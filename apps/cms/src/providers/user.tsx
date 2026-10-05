"use client";

import type { RouterInputs } from "@marble/api/routers";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { authClient, useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import type { UserContextType } from "@/types/user";
import { clearLastVisitedWorkspace } from "@/utils/workspace/client";

interface UserProviderProps {
  children: React.ReactNode;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: UserProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, isPending: isSessionPending } = useSession();
  const isAuthenticated = !!session;

  const { data: user = null, isLoading: isFetchingUser } = useQuery(
    orpc.me.get.queryOptions({
      enabled: isAuthenticated && !isSessionPending,
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    })
  );

  const { mutateAsync: updateUserMutation, isPending: isUpdatingUser } =
    useMutation(
      orpc.me.update.mutationOptions({
        onSuccess: (data) => {
          toast.success("Profile updated");
          queryClient.setQueryData(orpc.me.get.queryKey(), data);
        },
        onError: (_error) => {
          toast.error("Failed to update profile");
        },
      })
    );

  const updateUser = async (updates: RouterInputs["me"]["update"]) => {
    await updateUserMutation(updates);
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      // Drop every cached query, not just the profile: the next account to
      // sign in on this tab must not see this one's workspaces or content.
      queryClient.clear();
      clearLastVisitedWorkspace();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out");
    }
    setIsSigningOut(false);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        isFetchingUser,
        updateUser,
        isUpdatingUser,
        signOut,
        isSigningOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
