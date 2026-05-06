"use client";

import { FilterResetIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
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
import {
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RowsIcon,
  SortAscendingIcon,
  SquaresFourIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { Table } from "@tanstack/react-table";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { useMediaPageFilters } from "@/lib/search-params";
import type { Media, MediaFilterType, MediaSort } from "@/types/media";
import { isMediaFilterType, isMediaSort, toMediaType } from "@/utils/media";
import { FileUploadInput } from "./file-upload-input";

interface MediaTableToolbarProps {
  disabled?: boolean;
  isUploading: boolean;
  onBulkDelete: () => void;
  onUpload?: (files: FileList) => void;
  selectedCount: number;
  table: Table<Media>;
}

type MediaViewType = "table" | "grid";

const typeOptions: Array<{ label: string; value: MediaFilterType }> = [
  { label: "All", value: "all" },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "Documents", value: "document" },
];

const sortOptions: Array<{
  column: "createdAt" | "name";
  desc: boolean;
  label: string;
  value: MediaSort;
}> = [
  {
    column: "createdAt",
    desc: true,
    label: "Newest first",
    value: "createdAt_desc",
  },
  {
    column: "createdAt",
    desc: false,
    label: "Oldest first",
    value: "createdAt_asc",
  },
  { column: "name", desc: false, label: "Name A-Z", value: "name_asc" },
  { column: "name", desc: true, label: "Name Z-A", value: "name_desc" },
];

export function MediaTableToolbar({
  disabled = false,
  isUploading,
  onBulkDelete,
  onUpload,
  selectedCount,
  table,
}: MediaTableToolbarProps) {
  const [{ search, sort, type }, setSearchParams] = useMediaPageFilters();
  const [viewType, setViewType] = useLocalStorage<MediaViewType>(
    "mediaViewType",
    "table"
  );
  const [draftSearch, setDraftSearch] = useState(search);
  const debouncedSearch = useDebounce(draftSearch.trim(), 300);

  const isDisabled = disabled || isUploading;
  const activeFilterCount = toMediaType(type) ? 1 : 0;
  const hasActiveFilters =
    search.trim() !== "" || type !== "all" || sort !== "createdAt_desc";

  const handleSortChange = (value: MediaSort | null) => {
    if (!(value && isMediaSort(value))) {
      return;
    }
    const nextSort = sortOptions.find((option) => option.value === value);
    if (!nextSort) {
      return;
    }
    table.setSorting([{ id: nextSort.column, desc: nextSort.desc }]);
  };

  useEffect(() => {
    setDraftSearch(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === search) {
      return;
    }
    setSearchParams({ page: 1, search: debouncedSearch });
  }, [debouncedSearch, search, setSearchParams]);

  const resetFilters = () => {
    setDraftSearch("");
    table.setSorting([{ id: "createdAt", desc: true }]);
    setSearchParams({
      page: 1,
      search: "",
      sort: "createdAt_desc",
      type: "all",
    });
  };

  return (
    <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            size={16}
          />
          <Input
            aria-label="Search media by name"
            className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
            disabled={isDisabled}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search media..."
            value={draftSearch}
          />
          {draftSearch && (
            <button
              className="-translate-y-1/2 absolute top-1/2 right-3"
              disabled={isDisabled}
              onClick={() => {
                setDraftSearch("");
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
          aria-label="Sort media"
          disabled={isDisabled}
          items={sortOptions}
          onValueChange={handleSortChange}
          value={sort}
        >
          <SelectTrigger className="h-9 rounded-[12px] font-normal shadow-none">
            <SortAscendingIcon className="text-muted-foreground" />
            <span>Sort</span>
            <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              1
            </span>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          aria-label="Filter by file type"
          disabled={isDisabled}
          items={typeOptions}
          onValueChange={(value) => {
            if (isMediaFilterType(value as MediaFilterType)) {
              setSearchParams({
                page: 1,
                type: value as MediaFilterType,
              });
            }
          }}
          value={type}
        >
          <SelectTrigger className="h-9 rounded-[12px] font-normal shadow-none">
            <FunnelSimpleIcon className="text-muted-foreground" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
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
                  disabled={isDisabled}
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

        {selectedCount > 0 && (
          <div className="flex h-9 items-center gap-1 rounded-lg bg-surface p-0.5">
            <Button
              className="h-8 rounded-md px-2 font-medium text-xs"
              disabled={isDisabled}
              onClick={() => table.resetRowSelection()}
              size="xs"
              type="button"
              variant="ghost"
            >
              <XIcon />
              {selectedCount} selected
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={`Delete selected (${selectedCount})`}
                    className="size-8 rounded-md"
                    disabled={isDisabled}
                    onClick={onBulkDelete}
                    size="icon-sm"
                    type="button"
                    variant="destructive"
                  >
                    <TrashIcon aria-hidden="true" size={16} />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Delete selected ({selectedCount})</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        {/* <div className="flex gap-0.5 rounded-xl bg-surface p-0.5 dark:bg-accent/50">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="relative h-8 w-9 rounded-[10px]"
                  disabled
                  onClick={() => setViewType("grid")}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  {viewType === "grid" && (
                    <motion.div
                      className="absolute inset-0 rounded-[10px] bg-background shadow-sm"
                      layoutId="mediaViewToggleHighlight"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <SquaresFourIcon className="relative z-10" size={16} />
                  <span className="sr-only">Grid view</span>
                </Button>
              }
            />
            <TooltipContent>
              <p>Grid view coming soon</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="relative h-8 w-9 rounded-[10px]"
                  onClick={() => setViewType("table")}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  {viewType === "table" && (
                    <motion.div
                      className="absolute inset-0 rounded-[10px] bg-background shadow-sm"
                      layoutId="mediaViewToggleHighlight"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <RowsIcon className="relative z-10" size={16} />
                  <span className="sr-only">Table view</span>
                </Button>
              }
            />
            <TooltipContent>
              <p>Table view</p>
            </TooltipContent>
          </Tooltip>
        </div> */}
        {onUpload && (
          <FileUploadInput
            className="h-9 w-full sm:w-auto"
            isUploading={isUploading}
            onUpload={onUpload}
            variant="icon"
          >
            <PlusIcon className="size-4" />
            <span>Upload</span>
          </FileUploadInput>
        )}
      </div>
    </section>
  );
}
