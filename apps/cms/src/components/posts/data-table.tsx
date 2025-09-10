"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import {
  GridFourIcon,
  ListIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function PostDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleRowClick = (post: Post, event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).closest('[data-actions-cell="true"]') ||
      (event.target as HTMLElement).closest("button") ||
      (event.target as HTMLElement).closest("a") ||
      (event.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      return;
    }
    router.push(`/${activeWorkspace?.slug}/editor/p/${post.id}`);
  };

  return (
    <div>
      <div className="flex items-center py-4 justify-between">
        <div className="relative">
          <MagnifyingGlassIcon
            size={16}
            className="text-muted-foreground size-4 absolute top-3 left-3"
          />
          <Input
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            placeholder="Search posts..."
            className="px-8 w-72"
          />
          {(table.getColumn("title")?.getFilterValue() as string) && (
            <button
              type="button"
              onClick={() => table.getColumn("title")?.setFilterValue("")}
              className="absolute right-3 top-3"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex border rounded-md overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none px-3 opacity-50 cursor-not-allowed hover:bg-transparent"
                      disabled
                    >
                      <GridFourIcon size={16} />
                      <span className="sr-only">Card View (coming soon)</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Card View (coming soon)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none px-3 bg-accent text-accent-foreground"
                  >
                    <ListIcon size={16} />
                    <span className="sr-only">Table View</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Table View</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Link
            href={`/${activeWorkspace?.slug}/editor/p/new`}
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon size={16} />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(event) =>
                    handleRowClick(row.original as Post, event)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      {...(cell.column.id === "actions" && {
                        "data-actions-cell": "true",
                        onClick: (e: React.MouseEvent) => e.stopPropagation(),
                      })}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-96 text-center"
                >
                  No posts results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
