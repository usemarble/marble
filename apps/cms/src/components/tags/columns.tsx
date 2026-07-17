"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Tag } from "@/types/dashboard";
import TableActions from "./table-actions";

export type { Tag } from "@/types/dashboard";

export const columns: ColumnDef<Tag>[] = [
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
      const tag = row.original;

      return (
        <div className="flex justify-end">
          <TableActions {...tag} />
        </div>
      );
    },
  },
];
