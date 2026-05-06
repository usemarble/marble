"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { columns } from "@/components/authors/columns";
import { AuthorDataTable } from "@/components/authors/data-table";
import { DashboardBody } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import type { Author } from "@/types/author";

function PageClient() {
  const workspaceId = useWorkspaceId();
  const { isFetchingWorkspace } = useWorkspace();

  const { data: authors, isLoading } = useQuery({
    queryKey: workspaceId
      ? QUERY_KEYS.AUTHORS(workspaceId)
      : ["authors", "disabled"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/authors");
        if (!response.ok) {
          throw new Error("Failed to fetch authors");
        }
        const data: Author[] = await response.json();
        return data;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch authors"
        );
      }
    },
    enabled: Boolean(workspaceId) && !isFetchingWorkspace,
  });

  if (isFetchingWorkspace || !workspaceId || isLoading) {
    return <PageLoader />;
  }

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div className="space-y-6">
        <AuthorDataTable columns={columns} data={authors || []} />
      </div>
    </DashboardBody>
  );
}

export default PageClient;
