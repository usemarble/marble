"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import PostActions from "./post-actions";

export interface Post {
  id: string;
  title: string;
  status: "published" | "unpublished";
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  authors: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
}

export const columns: ColumnDef<Post>[] = [
  {
    id: "category",
    accessorFn: (row) => row.category.id,
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) {
        return true;
      }
      return row.original.category.id === filterValue;
    },
    enableHiding: true,
  },
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
    header: ({ column }) => (
      <Button
        className="h-8 gap-1.5 px-2 font-medium text-muted-foreground text-sm shadow-none hover:bg-muted active:scale-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        size="sm"
        variant="ghost"
      >
        Status
        <CaretUpDownIcon className="size-3.5 opacity-70" />
      </Button>
    ),
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
        className="h-8 gap-1.5 px-2 font-medium text-muted-foreground text-sm shadow-none hover:bg-muted active:scale-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        size="sm"
        variant="ghost"
      >
        Published
        <CaretUpDownIcon className="size-3.5 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => format(row.original.publishedAt, "MMM dd, yyyy"),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        className="h-8 gap-1.5 px-2 font-medium text-muted-foreground text-sm shadow-none hover:bg-muted active:scale-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        size="sm"
        variant="ghost"
      >
        Last Updated
        <CaretUpDownIcon className="size-3.5 opacity-70" />
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
