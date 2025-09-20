"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import dynamic from "next/dynamic";
import Link from "next/link";
import { type ComponentType, type JSX, useState } from "react";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";

const DataGrid = dynamic(
  () => import("./data-grid").then((mod) => ({ default: mod.DataGrid })),
  {
    ssr: false,
  }
) as ComponentType<{ data: Post[] }>;

const DataTable = dynamic(
  () => import("./data-table").then((mod) => ({ default: mod.DataTable })),
  {
    ssr: false,
  }
) as <TData, TValue>(props: {
  table: ReturnType<typeof useReactTable<TData>>;
  columns: ColumnDef<TData, TValue>[];
}) => JSX.Element;

type DataViewProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
};

type ViewType = "table" | "grid";

export function PostDataView<TData, TValue>({
  columns,
  data,
}: DataViewProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [viewType, setViewType] = useLocalStorage<ViewType | null>(
    "viewType",
    "table"
  );

  const { activeWorkspace } = useWorkspace();

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between py-4">
        <div className="relative">
          <MagnifyingGlassIcon
            size={16}
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
          />
          <Input
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            placeholder="Search posts..."
            className="w-72 px-8"
          />
          {(table.getColumn("title")?.getFilterValue() as string) && (
            <button
              type="button"
              onClick={() => table.getColumn("title")?.setFilterValue("")}
              className="absolute top-3 right-3"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-sidebar p-1 dark:bg-accent/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "size-7 rounded-r-none rounded-l-[8px] px-3 transition duration-300",
                    viewType === "grid" &&
                      "bg-background text-accent-foreground shadow-sm hover:bg-background dark:hover:bg-background"
                  )}
                  onClick={() => setViewType("grid")}
                >
                  <SquaresFourIcon size={16} />
                  <span className="sr-only">Grid View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "size-7 rounded-r-[8px] rounded-l-none px-3 transition duration-300",
                    viewType === "table" &&
                      "bg-background text-accent-foreground shadow-sm hover:bg-background dark:hover:bg-background"
                  )}
                  onClick={() => setViewType("table")}
                >
                  <RowsIcon size={16} />
                  <span className="sr-only">Table View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Table View</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Link
            href={`/${activeWorkspace?.slug}/editor/p/new`}
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon size={16} />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {viewType === "table" ? (
        <DataTable table={table} columns={columns} />
      ) : (
        <DataGrid
          data={
            table
              .getFilteredRowModel()
              .rows.map((row) => row.original) as Post[]
          }
        />
      )}
    </div>
  );
}
