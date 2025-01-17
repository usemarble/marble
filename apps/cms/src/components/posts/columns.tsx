"use client";

import { Badge } from "@repo/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import TableActions from "./table-actions";

export type Post = {
  id: string;
  title: string;
  status: "published" | "unpublished";
  publishedAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant="outline"
          className={
            status === "published"
              ? "bg-emerald-100 text-emerald-600 border-emerald-400"
              : "bg-amber-100 text-amber-600 border-amber-400"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => format(row.original.publishedAt, "MMM dd, yyyy"),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => format(row.original.updatedAt, "MMM dd, yyyy"),
  },
  {
    id: "actions",
    header: ({ column }) => (
      <div className="flex justify-end pr-10">Actions</div>
    ),
    cell: ({ row }) => {
      const post = row.original;

      return (
        <div className="flex justify-end pr-10">
          <TableActions {...post} />
        </div>
      );
    },
  },
];
