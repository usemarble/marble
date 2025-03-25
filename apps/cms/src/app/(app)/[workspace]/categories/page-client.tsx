"use client";

import { columns } from "@/components/categories/columns";
import { DataTable } from "@/components/categories/data-table";

interface PageClientProps {
  categories: { id: string; name: string; slug: string }[];
}

function PageClient({ categories }: PageClientProps) {
  return (
    <div className="h-full flex flex-col mx-auto pt-10 pb-16 max-w-4xl">
      <DataTable data={categories} columns={columns} />
    </div>
  );
}

export default PageClient;
