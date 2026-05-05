import { Button } from "@marble/ui/components/button";
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
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMediaPageFilters } from "@/lib/search-params";
import { isMediaFilterType, isMediaSort } from "@/utils/media";
import { FileUploadInput } from "./file-upload-input";

const typeOptions = [
  { label: "All", value: "all" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
];

const sortOptions = [
  { label: "Newest first", value: "createdAt_desc" },
  { label: "Oldest first", value: "createdAt_asc" },
  { label: "Name A-Z", value: "name_asc" },
  { label: "Name Z-A", value: "name_desc" },
];

export function MediaControls({
  onUpload,
  isUploading,
  selectedItems,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  mediaLength,
  viewType,
  onViewTypeChange,
  disabled = false,
}: {
  onUpload: (files: FileList) => void;
  isUploading: boolean;
  selectedItems: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  mediaLength: number;
  viewType: "table" | "grid";
  onViewTypeChange: (viewType: "table" | "grid") => void;
  disabled?: boolean;
}) {
  const [{ type, sort }, setSearchParams] = useMediaPageFilters();

  const isDisabled = disabled || isUploading;
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-wrap items-center gap-1 sm:gap-4">
        <Select
          disabled={isDisabled}
          items={typeOptions}
          onValueChange={(val) => {
            if (val && isMediaFilterType(val)) {
              setSearchParams({ type: val });
            }
          }}
          value={type}
        >
          <SelectTrigger className="min-w-[100px]">
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
        <Select
          disabled={isDisabled}
          items={sortOptions}
          onValueChange={(val) => {
            if (val && isMediaSort(val)) {
              setSearchParams({ sort: val });
            }
          }}
          value={sort}
        >
          <SelectTrigger className="min-w-[150px]">
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
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <Button
              aria-label="Deselect all"
              disabled={isDisabled}
              onClick={onDeselectAll}
              size="icon"
              type="button"
              variant="outline"
            >
              <XIcon aria-hidden="true" size={16} />
            </Button>
          )}
          {mediaLength > 0 && (
            <Button
              className="shadow-none"
              disabled={isDisabled}
              onClick={onSelectAll}
              type="button"
              variant="outline"
            >
              {selectedItems.size === mediaLength
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
          {selectedItems.size > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={`Delete selected (${selectedItems.size})`}
                    disabled={isDisabled}
                    onClick={onBulkDelete}
                    size="icon"
                    type="button"
                    variant="destructive"
                  >
                    <TrashIcon aria-hidden="true" size={16} />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Delete selected ({selectedItems.size})</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="flex gap-0.5 rounded-xl bg-surface p-0.5 dark:bg-accent/50">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="relative h-8 w-9 rounded-[10px]"
                  disabled
                  onClick={() => onViewTypeChange("grid")}
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
                  onClick={() => onViewTypeChange("table")}
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
        </div>
        <FileUploadInput
          className="w-full sm:w-auto"
          isUploading={isUploading}
          onUpload={onUpload}
          variant="icon"
        >
          <PlusIcon className="size-4" />
          <span>Upload</span>
        </FileUploadInput>
      </div>
    </section>
  );
}
