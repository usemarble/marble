"use client";

import { columns } from "@/components/tags/columns";
import { DataTable } from "@/components/tags/data-table";

interface PageClientProps {
  tags: { id: string; name: string; slug: string }[];
}

function PageClient({ tags }: PageClientProps) {
  return (
    <div className="h-full flex flex-col max-w-screen-lg mx-auto pt-16">
      <DataTable data={tags} columns={columns} />
    </div>
  );
}

export default PageClient;
