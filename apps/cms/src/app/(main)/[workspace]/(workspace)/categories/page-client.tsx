"use client";

import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";

interface PageClientProps {
  categories: { id: string; name: string; slug: string }[];
}

function PageClient({ categories }: PageClientProps) {
  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      <DataTable data={categories} columns={columns} />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
