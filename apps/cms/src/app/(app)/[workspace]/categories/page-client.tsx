"use client";

import { DataTable } from "@/components/categories/data-table";
import { columns } from "@/components/tags/columns";

interface PageClientProps {
  categories: { id: string; name: string; slug: string }[];
}

function PageClient({ categories }: PageClientProps) {
  return (
    <div className="h-full flex flex-col max-w-screen-lg mx-auto pt-16">
      <DataTable data={categories} columns={columns} />
    </div>
  );
}

export default PageClient;
