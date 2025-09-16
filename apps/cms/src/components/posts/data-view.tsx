"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
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

const DataCard = dynamic(
  () => import("./data-card").then((mod) => ({ default: mod.DataCard })),
  {
    ssr: false,
  },
) as ComponentType<{ data: Post[] }>;

const DataTable = dynamic(
  () => import("./data-table").then((mod) => ({ default: mod.DataTable })),
  {
    ssr: false,
  },
) as <TData, TValue>(props: {
  table: ReturnType<typeof useReactTable<TData>>;
  columns: ColumnDef<TData, TValue>[];
}) => JSX.Element;

interface DataViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

type ViewType = "table" | "card";

export function PostDataView<TData, TValue>({
  columns,
  data,
}: DataViewProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [viewType, setViewType] = useLocalStorage<ViewType | null>(
    "viewType",
    "table",
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-3 ${
                      viewType === "card"
                        ? ""
                        : "bg-accent text-accent-foreground"
                    }`}
                    onClick={() => setViewType("card")}
                  >
                    <GridFourIcon size={16} />
                    <span className="sr-only">Card View</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Card View</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-3 ${
                      viewType === "table"
                        ? ""
                        : "bg-accent text-accent-foreground"
                    }`}
                    onClick={() => setViewType("table")}
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

      {viewType === "table" ? (
        <DataTable table={table} columns={columns} />
      ) : (
        <DataCard
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
