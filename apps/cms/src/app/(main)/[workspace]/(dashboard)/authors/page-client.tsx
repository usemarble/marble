"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { columns } from "@/components/authors/columns";
import { AuthorDataTable } from "@/components/authors/data-table";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import type { Author } from "@/types/author";

function PageClient() {
  const { activeWorkspace } = useWorkspace();

  const { data: authors, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUTHORS(activeWorkspace?.id ?? ""),
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
    enabled: !!activeWorkspace?.id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <WorkspacePageWrapper
      className="flex flex-col gap-8 pt-10 pb-16"
      size="compact"
    >
      <div className="space-y-6">
        <AuthorDataTable columns={columns} data={authors || []} />
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
