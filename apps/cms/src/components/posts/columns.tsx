"use client";

import { Badge } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
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
    cell: ({ row }) => {
      const title = row.original.title;
      return (
        <div className="max-w-72 overflow-x-auto">
          <p className="truncate">{title}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={cn("w-full justify-center rounded-[6px] text-center", {
            "border-emerald-300 bg-emerald-50 text-emerald-500 dark:bg-transparent":
              status === "published",
            "border-amber-300 bg-amber-50 text-orange-500 dark:bg-transparent":
              status === "unpublished",
          })}
          variant="outline"
        >
          {status === "published" ? "Published" : "Draft"}
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
    header: () => <div className="flex justify-end pr-10">Actions</div>,
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
