"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
  UploadSimpleIcon,
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

const PostsImportModal = dynamic(
  () =>
    import("@/components/posts/import-modal").then((m) => m.PostsImportModal),
  { ssr: false }
);

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
  const [importOpen, setImportOpen] = useState(false);
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
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            size={16}
          />
          <Input
            className="w-72 px-8"
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            placeholder="Search posts..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          />
          {(table.getColumn("title")?.getFilterValue() as string) && (
            <button
              className="absolute top-3 right-3"
              onClick={() => table.getColumn("title")?.setFilterValue("")}
              type="button"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewType ?? "table"} onValueChange={(v) => setViewType(v as ViewType)}>
            <TabsList className="flex h-auto gap-1 rounded-xl bg-sidebar p-1 dark:bg-accent/50">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <TabsTrigger
                      value="grid"
                      className="size-7 flex items-center justify-center px-0 transition duration-300 hover:text-accent-foreground data-[active]:text-accent-foreground"
                    />
                  }
                >
                  <SquaresFourIcon className="size-4" />
                  <span className="sr-only">Grid View</span>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <TabsTrigger
                      value="table"
                      className="size-7 flex items-center justify-center px-0 transition duration-300 hover:text-accent-foreground data-[active]:text-accent-foreground"
                    />
                  }
                >
                  <RowsIcon className="size-4" />
                  <span className="sr-only">Table View</span>
                </TooltipTrigger>
                <TooltipContent>Table View</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Link
              className={buttonVariants({ variant: "default" })}
              href={`/${activeWorkspace?.slug}/editor/p/new`}
            >
              <PlusIcon size={16} />
              <span>New Post</span>
            </Link>
            <Tooltip>
              <TooltipTrigger render={<Button
                  aria-label="Upload"
                  onClick={() => setImportOpen(true)}
                  variant="default"
                />}>
                <UploadSimpleIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Upload</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {viewType === "table" ? (
        <DataTable columns={columns} table={table} />
      ) : (
        <DataGrid
          data={
            table
              .getFilteredRowModel()
              .rows.map((row) => row.original) as Post[]
          }
        />
      )}
      <PostsImportModal open={importOpen} setOpen={setImportOpen} />
    </div>
  );
}
