"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { CaretUpDownIcon, ImageIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Image from "next/image";
import { formatCalendarDate } from "@/utils/string";
import PostActions from "./post-actions";

export interface Post {
  id: string;
  title: string;
  coverImage: string | null;
  status: "published" | "draft";
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
    header: "Post",
    cell: ({ row }) => {
      const { category, coverImage, title } = row.original;
      return (
        <div className="flex min-w-0 max-w-82 items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
            {coverImage ? (
              <Image
                alt=""
                className="size-full object-cover"
                height={48}
                src={coverImage}
                unoptimized
                width={48}
              />
            ) : (
              <div className="grid size-full place-items-center border border-dashed bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))]">
                <ImageIcon
                  className="size-5 text-muted-foreground"
                  weight="duotone"
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-xs">{title}</p>
            <p className="truncate text-muted-foreground text-xs">
              {category.name}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    enableSorting: false,
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className="rounded-[6px] text-xs"
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
        className="-ml-2 h-8 gap-1.5 rounded-md px-2 font-medium text-muted-foreground text-xs shadow-none hover:bg-background hover:text-foreground active:scale-100 dark:hover:bg-accent dark:hover:text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        size="sm"
        variant="ghost"
      >
        Published
        <CaretUpDownIcon className="size-3.5 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {formatCalendarDate(new Date(row.original.publishedAt), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        className="-ml-2 h-8 gap-1.5 rounded-md px-2 font-medium text-muted-foreground text-xs shadow-none hover:bg-background hover:text-foreground active:scale-100 dark:hover:bg-accent dark:hover:text-muted-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        size="sm"
        variant="ghost"
      >
        Last Updated
        <CaretUpDownIcon className="size-3.5 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {format(row.original.updatedAt, "MMM d, yyyy")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const post = row.original;

      return (
        <div className="flex justify-end">
          <PostActions post={post} />
        </div>
      );
    },
  },
];
