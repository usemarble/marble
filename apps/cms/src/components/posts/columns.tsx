"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import PostActions from "./post-actions";

export type Post = {
  id: string;
  title: string;
  status: "published" | "unpublished";
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  authors: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
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
          className="rounded-[6px]"
          variant={status === "published" ? "positive" : "pending"}
        >
          {status === "published" ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => (
      <Button
        className="h-auto font-medium hover:bg-transparent has-[>svg]:px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Published
        <CaretUpDownIcon className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(row.original.publishedAt, "MMM dd, yyyy"),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        className="h-auto font-medium hover:bg-transparent has-[>svg]:px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Last Updated
        <CaretUpDownIcon className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(row.original.updatedAt, "MMM dd, yyyy"),
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const post = row.original;

      return (
        <div className="flex justify-end pr-10">
          <PostActions post={post} />
        </div>
      );
    },
  },
];
