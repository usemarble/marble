"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { CaretUpDownIcon } from "@phosphor-icons/react";
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
          variant={status === "published" ? "positive" : "pending"}
          className="rounded-[6px]"
        >
          {status === "published" ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Published
          <CaretUpDownIcon className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => format(row.original.publishedAt, "MMM dd, yyyy"),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Last Updated
          <CaretUpDownIcon className="h-4 w-4" />
        </Button>
      );
    },
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
