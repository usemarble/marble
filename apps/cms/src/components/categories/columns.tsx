"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Category } from "@/types/dashboard";
import TableActions from "./table-actions";

export type { Category } from "@/types/dashboard";

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "postsCount",
    header: () => <div className="text-center">Posts</div>,
    cell: ({ row }) => (
      <p className="text-center">{row.getValue("postsCount")}</p>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;

      return (
        <div className="flex justify-end">
          <TableActions {...category} />
        </div>
      );
    },
  },
];
