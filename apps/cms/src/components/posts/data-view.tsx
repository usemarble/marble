"use client";

import { FileImportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
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
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { type ComponentType, type JSX, useState } from "react";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";

interface Category {
  id: string;
  name: string;
}

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
  rows: ReturnType<
    ReturnType<typeof useReactTable<TData>>["getRowModel"]
  >["rows"];
  columns: ColumnDef<TData, TValue>[];
}) => JSX.Element;

const PostsImportModal = dynamic(
  () =>
    import("@/components/posts/import-modal").then((m) => m.PostsImportModal),
  { ssr: false }
);

interface DataViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: QUERY_KEYS.CATEGORIES(activeWorkspace?.id ?? ""),
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
    enabled: !!activeWorkspace?.id,
  });
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
    initialState: {
      columnVisibility: {
        category: false,
      },
    },
  });

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-xs">
            {table.getFilteredRowModel().rows.length === data.length ? (
              <span>Showing {data.length} posts</span>
            ) : (
              <span>
                Showing {table.getFilteredRowModel().rows.length} of{" "}
                {data.length} posts
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative">
              <MagnifyingGlassIcon
                className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
                size={16}
              />
              <Input
                className="w-full px-8 sm:w-72"
                onChange={(event) =>
                  table.getColumn("title")?.setFilterValue(event.target.value)
                }
                placeholder="Search posts..."
                value={
                  (table.getColumn("title")?.getFilterValue() as string) ?? ""
                }
              />
              {(table.getColumn("title")?.getFilterValue() as string) && (
                <button
                  className="absolute top-2.5 right-3"
                  onClick={() => table.getColumn("title")?.setFilterValue("")}
                  type="button"
                >
                  <XIcon className="size-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
            <Select
              items={categoryOptions}
              onValueChange={(value) => {
                const categoryValue = value === "all" ? null : value;
                setSelectedCategory(categoryValue);
                table.getColumn("category")?.setFilterValue(categoryValue);
              }}
              value={selectedCategory ?? "all"}
            >
              <SelectTrigger className="w-40 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div className="flex gap-0.5 rounded-xl bg-surface p-0.5 dark:bg-accent/50">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    className="relative h-8 w-9 rounded-[10px]"
                    onClick={() => setViewType("grid")}
                    size="icon-sm"
                    variant="ghost"
                  >
                    {viewType === "grid" && (
                      <motion.div
                        className="absolute inset-0 rounded-[10px] bg-background shadow-sm"
                        layoutId="viewToggleHighlight"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.4,
                        }}
                      />
                    )}
                    <SquaresFourIcon className="relative z-10" size={16} />
                    <span className="sr-only">Grid View</span>
                  </Button>
                }
              />
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    className="relative h-8 w-9 rounded-[10px]"
                    onClick={() => setViewType("table")}
                    size="icon-sm"
                    variant="ghost"
                  >
                    {viewType === "table" && (
                      <motion.div
                        className="absolute inset-0 rounded-[10px] bg-background shadow-sm"
                        layoutId="viewToggleHighlight"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.4,
                        }}
                      />
                    )}
                    <RowsIcon className="relative z-10" size={16} />
                    <span className="sr-only">Table View</span>
                  </Button>
                }
              />
              <TooltipContent>
                <p>Table View</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            <Link
              className={buttonVariants({ variant: "default" })}
              href={`/${activeWorkspace?.slug}/editor/p/new`}
            >
              <PlusIcon size={16} />
              <span>New Post</span>
            </Link>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Upload"
                    onClick={() => setImportOpen(true)}
                    variant="default"
                  >
                    <HugeiconsIcon
                      icon={FileImportIcon}
                      size={16}
                      strokeWidth={2}
                    />
                  </Button>
                }
              />
              <TooltipContent side="top">Upload</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      {viewType === "table" ? (
        <DataTable
          columns={columns}
          rows={table.getRowModel().rows}
          table={table}
        />
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
