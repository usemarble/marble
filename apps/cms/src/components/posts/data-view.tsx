"use client";

import { FileImportIcon, FilterResetIcon } from "@hugeicons/core-free-icons";
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
  getCoreRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  type ComponentType,
  type JSX,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { POST_SORTS, usePostPageFilters } from "@/lib/search-params";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";
import type { DataTableProps } from "./data-table";

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
  { ssr: false }
) as <TData>(props: DataTableProps<TData>) => JSX.Element;

const PostsImportModal = dynamic(
  () =>
    import("@/components/posts/import-modal").then((m) => m.PostsImportModal),
  { ssr: false }
);

interface DataViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isFetching?: boolean;
  pageCount: number;
  totalCount: number;
}

type ViewType = "table" | "grid";

export function PostDataView<TData, TValue>({
  columns,
  data,
  isFetching = false,
  pageCount,
  totalCount,
}: DataViewProps<TData, TValue>) {
  const [
    { category, page, perPage, search: initialSearch, sort, status },
    setSearchParams,
  ] = usePostPageFilters();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [viewType, setViewType] = useLocalStorage<ViewType | null>(
    "viewType",
    "table"
  );

  const { activeWorkspace } = useWorkspace();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (debouncedSearch === initialSearch) {
      return;
    }
    setSearchParams({ page: 1, search: debouncedSearch });
  }, [debouncedSearch, initialSearch, setSearchParams]);

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
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(0, page - 1),
      pageSize: perPage,
    }),
    [page, perPage]
  );

  const sorting = useMemo<SortingState>(() => {
    const [id, direction] = sort.split("_");
    return [{ id: id ?? "createdAt", desc: direction !== "asc" }];
  }, [sort]);

  const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    const nextPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;

    setSearchParams({
      page: nextPagination.pageIndex + 1,
      perPage: nextPagination.pageSize,
    });
  };

  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const nextSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    const [firstSort] = nextSorting;
    const nextSort = firstSort
      ? `${firstSort.id}_${firstSort.desc ? "desc" : "asc"}`
      : "createdAt_desc";

    setSearchParams({
      page: 1,
      sort: POST_SORTS.includes(nextSort as (typeof POST_SORTS)[number])
        ? (nextSort as (typeof POST_SORTS)[number])
        : "createdAt_desc",
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange,
    onSortingChange,
    pageCount,
    state: {
      pagination,
      sorting,
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
  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
  ];
  const hasActiveFilters =
    category !== "all" ||
    status !== "all" ||
    sort !== "createdAt_desc" ||
    search.trim() !== "";

  const resetFilters = () => {
    setSearch("");
    setSearchParams({
      category: "all",
      page: 1,
      search: "",
      sort: "createdAt_desc",
      status: "all",
    });
  };

  return (
    <div>
      {/* table controls */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative">
              <MagnifyingGlassIcon
                className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
                size={16}
              />
              <Input
                className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder="Search posts..."
                value={search}
              />
              {search && (
                <button
                  className="-translate-y-1/2 absolute top-1/2 right-3"
                  onClick={() => {
                    setSearch("");
                    setSearchParams({ page: 1, search: "" });
                  }}
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
                setSearchParams({
                  category: value,
                  page: 1,
                });
              }}
              value={category}
            >
              <SelectTrigger className="h-9 w-36 rounded-[12px] shadow-none">
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
            <Select
              items={statusOptions}
              onValueChange={(value) => {
                setSearchParams({
                  page: 1,
                  status: value as "all" | "published" | "draft",
                });
              }}
              value={status}
            >
              <SelectTrigger className="h-9 w-32 rounded-[12px] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Reset filters"
                      className="h-9 w-9 rounded-[12px] p-0 shadow-none"
                      onClick={resetFilters}
                      type="button"
                      variant="outline"
                    >
                      <HugeiconsIcon icon={FilterResetIcon} size={16} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Reset filters</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div className="flex gap-0.5 rounded-xl bg-surface p-0.5 dark:bg-accent/50">
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
      {/* data table */}
      <div
        className={cn(
          "transition-opacity duration-150",
          isFetching && "pointer-events-none opacity-50"
        )}
      >
        {viewType === "table" ? (
          <div className="flex flex-col gap-3">
            <DataTable rows={table.getRowModel().rows} table={table} />
            <DataTablePagination
              canNextPage={pagination.pageIndex + 1 < pageCount}
              canPreviousPage={pagination.pageIndex > 0}
              itemLabel="post"
              onPageChange={(pageIndex) => {
                setSearchParams({ page: pageIndex + 1 });
              }}
              pageCount={pageCount}
              pageIndex={pagination.pageIndex}
              rowCount={data.length}
              selectedCount={0}
              totalCount={totalCount}
              visibleCount={table.getRowModel().rows.length}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <DataGrid
              data={
                table.getRowModel().rows.map((row) => row.original) as Post[]
              }
            />
            <DataTablePagination
              canNextPage={pagination.pageIndex + 1 < pageCount}
              canPreviousPage={pagination.pageIndex > 0}
              itemLabel="post"
              onPageChange={(pageIndex) => {
                setSearchParams({ page: pageIndex + 1 });
              }}
              pageCount={pageCount}
              pageIndex={pagination.pageIndex}
              rowCount={data.length}
              selectedCount={0}
              totalCount={totalCount}
              visibleCount={table.getRowModel().rows.length}
            />
          </div>
        )}
      </div>
      <PostsImportModal open={importOpen} setOpen={setImportOpen} />
    </div>
  );
}
