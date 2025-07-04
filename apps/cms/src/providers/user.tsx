"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth/client";
import type { UserContextType, UserProfile } from "@/types/user";
import { request } from "@/utils/fetch/client";

interface UserProviderProps {
  children: React.ReactNode;
  initialUser: UserProfile | null;
  initialIsAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  initialUser,
  initialIsAuthenticated,
}: UserProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Use Better Auth's useSession hook to get current session
  const { data: session, isPending: isSessionPending } = useSession();
  const isAuthenticated = !!session || initialIsAuthenticated;

  // Update user state when session changes, but be careful not to clear initial data
  useEffect(() => {
    // Only clear user data if session is explicitly null and we're not still loading
    if (!session && !isSessionPending && !isSigningOut) {
      setUser(null);
      queryClient.removeQueries({ queryKey: ["currentUser"] });
    }
  }, [session, isSessionPending, isSigningOut, queryClient]);

  // Fetch current user from our custom API endpoint
  const fetchCurrentUser = async (): Promise<UserProfile> => {
    const response = await request<UserProfile>("/user", "GET");
    setUser(response.data);
    return response.data;
  };

  const { isLoading: isFetchingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    enabled:
      // Only fetch if:
      // 1. We don't have complete user data (no workspaceRole means incomplete)
      // 2. User is authenticated
      // 3. Session is not pending
      (!user || !user.workspaceRole) && isAuthenticated && !isSessionPending,
    initialData: initialUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update user mutation
  const { mutate: updateUserMutation, isPending: isUpdatingUser } = useMutation(
    {
      mutationFn: async (
        updates: Partial<Pick<UserProfile, "name" | "image">>,
      ) => {
        const response = await request<UserProfile>("/user", "PATCH", updates);
        return response.data;
      },
      onSuccess: (data) => {
        setUser(data);
        toast.success("Profile updated successfully");
        queryClient.setQueryData(["currentUser"], data);
      },
      onError: (_error) => {
        // console.error(error);
        toast.error("Failed to update profile");
      },
    },
  );

  const updateUser = async (
    updates: Partial<Pick<UserProfile, "name" | "image">>,
  ) => {
    updateUserMutation(updates);
  };

  // Sign out function
  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      setUser(null);
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
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
