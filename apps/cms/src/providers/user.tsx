"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { UserContextType, UserProfile } from "@/types/user";
import { request } from "@/utils/fetch/client";

type UserProviderProps = {
  children: React.ReactNode;
  initialUser: UserProfile | null;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, isPending: isSessionPending } = useSession();
  const isAuthenticated = !!session;

  const fetchCurrentUser = async (): Promise<UserProfile> => {
    try {
      const response = await request<UserProfile>("user");
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      throw error;
    }
  };

  const { isLoading: isFetchingUser } = useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { mutate: updateUserMutation, isPending: isUpdatingUser } = useMutation(
    {
      mutationFn: async (
        updates: Partial<Pick<UserProfile, "name" | "image">>
      ) => {
        const response = await request<UserProfile>("user", "PATCH", updates);
        return response.data;
      },
      onSuccess: (data) => {
        setUser(data);
        toast.success("Profile updated");
        queryClient.setQueryData(QUERY_KEYS.USER, data);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER });
      },
      onError: (_error) => {
        toast.error("Failed to update profile");
      },
    }
  );

  const updateUser = async (
    updates: Partial<Pick<UserProfile, "name" | "image">>
  ) => {
    updateUserMutation(updates);
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      queryClient.removeQueries({ queryKey: QUERY_KEYS.USER });
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
