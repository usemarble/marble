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
          variant="outline"
          className={cn("rounded-[6px] w-full text-center justify-center", {
            "bg-emerald-50 text-emerald-500 border-emerald-300":
              status === "published",
            "bg-amber-50 text-orange-500 border-amber-300":
              status === "unpublished",
          })}
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
