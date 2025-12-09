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
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMediaPageFilters } from "@/lib/search-params";
import type { MediaFilterType } from "@/types/media";
import { isMediaFilterType, isMediaSort } from "@/utils/media";
import { FileUploadInput } from "./file-upload-input";

export function MediaControls({
  onUpload,
  isUploading,
  selectedItems,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  mediaLength,
  disabled = false,
}: {
  onUpload: (files: FileList) => void;
  isUploading: boolean;
  selectedItems: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  mediaLength: number;
  disabled?: boolean;
}) {
  const [{ type, sort }, setSearchParams] = useMediaPageFilters();

  const isDisabled = disabled || isUploading;
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-wrap items-center gap-1 sm:gap-4">
        <Select
          disabled={isDisabled}
          onValueChange={(val: MediaFilterType) => {
            if (isMediaFilterType(val)) {
              setSearchParams({ type: val });
            }
          }}
          value={type}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select
          disabled={isDisabled}
          onValueChange={(val: string) => {
            if (isMediaSort(val)) {
              setSearchParams({ sort: val });
            }
          }}
          value={sort}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Newest first</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="name_asc">Name A-Z</SelectItem>
            <SelectItem value="name_desc">Name Z-A</SelectItem>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete selected ({selectedItems.size})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="flex justify-end">
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
