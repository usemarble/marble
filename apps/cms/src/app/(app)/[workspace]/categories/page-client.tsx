"use client";

import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";
import WorkspaceWrapper from "@/components/layout/workspace-wrapper";

interface PageClientProps {
  categories: { id: string; name: string; slug: string }[];
}

function PageClient({ categories }: PageClientProps) {
  return (
    <WorkspaceWrapper className="flex flex-col pt-10 pb-16 gap-8">
      <DataTable data={categories} columns={columns} />
    </WorkspaceWrapper>
  );
}

export default PageClient;
