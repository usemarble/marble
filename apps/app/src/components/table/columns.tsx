"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "@repo/ui/lib/icons";

import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Badge } from "@repo/ui/components/badge";

export type Article = {
  id: string;
  views: number;
  status: string;
  featured: boolean;
  createdAt: string;
  title: string;
};

export const columns: ColumnDef<Article>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "views",
    header: "Views",
  },
  {
    accessorKey: "satus",
    header: "Status",
    cell: ({ row }) => {
      const article = row.original;
      return <Badge variant={"outline"}>{article.status}</Badge>;
    },
  },
  {
    accessorKey: "created",
    header: "CreatedAt",
  },
  {
    accessorKey: "featured",
    header: "Featured",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const article = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Feature Article</DropdownMenuItem>
            <DropdownMenuItem>Edit Article</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete Article</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
