"use client";

import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";

interface PageClientProps {
  tags: { id: string; name: string; slug: string }[];
}

function PageClient({ tags }: PageClientProps) {
  return (
    <div className="h-full flex flex-col mx-auto pt-16 max-w-4xl">
      <DataTable data={tags} columns={columns} />
    </div>
  );
}

export default PageClient;
