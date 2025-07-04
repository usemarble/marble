"use client";

import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";

interface PageClientProps {
  tags: { id: string; name: string; slug: string }[];
}

function PageClient({ tags }: PageClientProps) {
  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      <DataTable data={tags} columns={columns} />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
