"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
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
  PlusIcon,
  RowsIcon,
  SortAscendingIcon,
  SquaresFourIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { Table } from "@tanstack/react-table";
import { motion } from "motion/react";
import { useState } from "react";
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
  const [draftType, setDraftType] = useState<MediaFilterType>(type);

  const isDisabled = disabled || isUploading;
  const activeFilterCount =
    (search.trim() ? 1 : 0) + (toMediaType(type) ? 1 : 0);

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

  const applyFilters = () => {
    setSearchParams({
      page: 1,
      search: draftSearch.trim(),
      type: draftType,
    });
  };

  const resetFilters = () => {
    setDraftSearch("");
    setDraftType("all");
    setSearchParams({
      page: 1,
      search: "",
      type: "all",
    });
  };

  return (
    <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className="font-normal"
                disabled={isDisabled}
                size="sm"
                type="button"
                variant="outline"
              >
                <SortAscendingIcon className="text-muted-foreground" />
                Sort
                <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  1
                </span>
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">Sort by</p>
                <p className="text-muted-foreground text-xs">
                  Organize media rows without changing the view.
                </p>
              </div>
              <Select
                aria-label="Sort media"
                disabled={isDisabled}
                items={sortOptions}
                onValueChange={handleSortChange}
                value={sort}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                className="font-normal"
                disabled={isDisabled}
                size="sm"
                type="button"
                variant="outline"
              >
                <FunnelSimpleIcon className="text-muted-foreground" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-72">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">Filter media</p>
                <p className="text-muted-foreground text-xs">
                  Search by name or narrow the list by file type.
                </p>
              </div>
              <Input
                aria-label="Search media by name"
                disabled={isDisabled}
                onChange={(event) => setDraftSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyFilters();
                  }
                }}
                placeholder="Search file names..."
                value={draftSearch}
              />
              <Select
                aria-label="Filter by file type"
                disabled={isDisabled}
                items={typeOptions}
                onValueChange={(value) => {
                  if (isMediaFilterType(value as MediaFilterType)) {
                    setDraftType(value as MediaFilterType);
                  }
                }}
                value={draftType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between gap-2">
                <Button
                  disabled={isDisabled || activeFilterCount === 0}
                  onClick={resetFilters}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <XIcon />
                  Reset
                </Button>
                <Button
                  disabled={isDisabled}
                  onClick={applyFilters}
                  size="sm"
                  type="button"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {selectedCount > 0 && (
          <div className="flex h-8 items-center gap-1 rounded-lg bg-surface p-0.5">
            <Button
              className="h-7 rounded-md px-2 font-medium text-xs"
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
                    className="size-7 rounded-md"
                    disabled={isDisabled}
                    onClick={onBulkDelete}
                    size="icon-xs"
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
            className="w-full sm:w-auto"
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
