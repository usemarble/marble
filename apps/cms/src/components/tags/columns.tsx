"use client";

import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
};

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
