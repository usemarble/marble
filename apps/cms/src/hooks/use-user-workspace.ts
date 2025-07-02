import { useQuery } from "@tanstack/react-query";
import { request } from "@/utils/fetch/client";

// Type for workspace with user role from our custom endpoint
export type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  userRole: string | null;
  subscription?: {
    id: string;
    status: string;
    plan: string;
  } | null;
};

export function useUserWorkspaces() {
  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await request<WorkspaceWithRole[]>("workspaces");
      return response.data;
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
