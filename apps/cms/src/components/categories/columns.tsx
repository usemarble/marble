"use client";

import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

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
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const tag = row.original;

      return (
        <div className="flex justify-end pr-10">
          <TableActions {...tag} />
        </div>
      );
    },
  },
];
