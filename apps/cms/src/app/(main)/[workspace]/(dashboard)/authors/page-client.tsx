"use client";

import { useQuery } from "@tanstack/react-query";
import { columns } from "@/components/authors/columns";
import { AuthorDataTable } from "@/components/authors/data-table";
import { DashboardBody } from "@/components/layout/wrapper";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import Loading from "./loading";

function PageClient() {
  const workspaceId = useWorkspaceId();

  const {
    data: authors,
    isLoading,
    error,
  } = useQuery(
    orpc.authors.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: Boolean(workspaceId),
    })
  );

  if (!workspaceId || isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <DashboardBody>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </DashboardBody>
    );
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
