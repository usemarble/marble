"use client";

import { Button } from "@marble/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { FileImageIcon } from "@phosphor-icons/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useMediaActions } from "@/hooks/use-media-actions";
import { useMediaPageFilters } from "@/lib/search-params";
import type { Media, MediaQueryKey, MediaSort } from "@/types/media";
import { isMediaFilterType, isMediaSort, toMediaType } from "@/utils/media";
import { DeleteMediaModal } from "./delete-modal";
import { FileUploadInput } from "./file-upload-input";
import { getMediaColumns } from "./media-columns";
import { MediaTableToolbar } from "./media-table-toolbar";

interface MediaDataTableProps {
  disabled?: boolean;
  hasAnyMedia: boolean;
  isUploading?: boolean;
  media: Media[];
  mediaQueryKey: MediaQueryKey;
  onUpload?: (files: FileList) => void;
  pageCount: number;
  totalCount: number;
}

function sortToSortingState(sort: MediaSort): SortingState {
  const [id, direction] = sort.split("_");
  return [{ id: id ?? "createdAt", desc: direction === "desc" }];
}

function sortingStateToSort(sorting: SortingState): MediaSort {
  const [firstSort] = sorting;
  if (!firstSort) {
    return "createdAt_desc";
  }

  const nextSort = `${firstSort.id}_${firstSort.desc ? "desc" : "asc"}`;
  return isMediaSort(nextSort) ? nextSort : "createdAt_desc";
}

export function MediaDataTable({
  disabled = false,
  hasAnyMedia,
  isUploading = false,
  media,
  mediaQueryKey,
  onUpload,
  pageCount,
  totalCount,
}: MediaDataTableProps) {
  const [{ page, perPage, search, sort, type }, setSearchParams] =
    useMediaPageFilters();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { handleDeleteComplete, handleBulkDeleteComplete } =
    useMediaActions(mediaQueryKey);

  const columns = useMemo(
    () =>
      getMediaColumns({
        onDelete: (item) => {
          setMediaToDelete([item]);
          setShowDeleteModal(true);
        },
      }),
    []
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(0, page - 1),
      pageSize: perPage,
    }),
    [page, perPage]
  );

  const sorting = useMemo(() => sortToSortingState(sort), [sort]);

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

    setSearchParams({
      page: 1,
      sort: sortingStateToSort(nextSorting),
    });
  };

  const table = useReactTable({
    data: media,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange,
    state: {
      pagination,
      rowSelection,
      sorting,
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset row selection whenever the server-backed table query changes
  useEffect(() => {
    setRowSelection({});
  }, [page, perPage, search, sort, type]);

  const selectedMedia = useMemo(
    () => media.filter((item) => rowSelection[item.id]),
    [media, rowSelection]
  );

  const onDeleteComplete = (ids: string[]) => {
    if (ids.length === 1 && ids[0]) {
      handleDeleteComplete(ids[0]);
    } else {
      handleBulkDeleteComplete(ids);
    }
    setRowSelection({});
  };

  const handleBulkDelete = () => {
    setMediaToDelete(selectedMedia);
    setShowDeleteModal(true);
  };

  if (!hasAnyMedia) {
    return (
      <>
        <div className="grid min-h-[50vh] place-content-center rounded-[20px] bg-surface p-6 text-center">
          <div className="flex max-w-80 flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-background">
              <FileImageIcon className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Media you upload in this workspace will appear here.
            </p>
            {onUpload && (
              <FileUploadInput isUploading={isUploading} onUpload={onUpload} />
            )}
          </div>
        </div>
        <DeleteMediaModal
          isOpen={showDeleteModal}
          mediaToDelete={mediaToDelete}
          onDeleteComplete={onDeleteComplete}
          setIsOpen={setShowDeleteModal}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <MediaTableToolbar
          disabled={disabled}
          isUploading={isUploading}
          onBulkDelete={handleBulkDelete}
          onUpload={onUpload}
          selectedCount={selectedMedia.length}
          table={table}
        />
        <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
          <Table className="-mb-1 h-fit border-separate border-spacing-y-1">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  className="border-0 text-[13px] hover:bg-transparent"
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className={getHeaderClassName(header.column.id)}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="border-0 bg-background hover:bg-background/80 data-[state=selected]:bg-background"
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={getCellClassName(cell.column.id)}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-0 bg-background">
                  <TableCell
                    className="h-28 rounded-[14px] text-center text-muted-foreground text-sm"
                    colSpan={columns.length}
                  >
                    No media found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <DataTablePagination
            canNextPage={pagination.pageIndex + 1 < pageCount}
            canPreviousPage={pagination.pageIndex > 0}
            mediaCount={media.length}
            onPageChange={(pageIndex) => {
              setSearchParams({ page: pageIndex + 1 });
            }}
            pageCount={pageCount}
            pageIndex={pagination.pageIndex}
            rowCount={media.length}
            selectedCount={selectedMedia.length}
            totalCount={totalCount}
          />
        </div>
      </div>
      <DeleteMediaModal
        isOpen={showDeleteModal}
        mediaToDelete={mediaToDelete}
        onDeleteComplete={onDeleteComplete}
        setIsOpen={setShowDeleteModal}
      />
    </>
  );
}

function getHeaderClassName(columnId: string) {
  switch (columnId) {
    case "select":
      return "w-10 px-3";
    case "alt":
      return "hidden px-3 text-muted-foreground lg:table-cell";
    case "createdAt":
      return "hidden px-3 text-muted-foreground md:table-cell";
    case "details":
    case "references":
      return "hidden px-3 text-muted-foreground 2xl:table-cell";
    case "actions":
      return "sr-only w-12 px-3 text-right text-muted-foreground";
    default:
      return "px-3 text-muted-foreground";
  }
}

function getCellClassName(columnId: string) {
  switch (columnId) {
    case "select":
      return "rounded-l-[14px] px-3 py-2";
    case "alt":
      return "hidden max-w-72 px-3 py-2 lg:table-cell";
    case "createdAt":
      return "hidden px-3 py-2 md:table-cell";
    case "details":
    case "references":
      return "hidden px-3 py-2 2xl:table-cell";
    case "actions":
      return "rounded-r-[14px] px-3 py-2";
    default:
      return "px-3 py-2";
  }
}
