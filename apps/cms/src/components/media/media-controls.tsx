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
}: {
  onUpload: (files: FileList) => void;
  isUploading: boolean;
  selectedItems: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  mediaLength: number;
}) {
  const [{ type, sort }, setSearchParams] = useMediaPageFilters();
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-wrap items-center gap-1 sm:gap-4">
        <Select
          onValueChange={(val) => {
            const v = val as MediaFilterType;
            if (isMediaFilterType(v)) {
              setSearchParams({ type: v });
            }
          }}
          value={type}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {(value) => {
                const labels: Record<string, string> = { all: "All", image: "Image", video: "Video" };
                return labels[value as string] || "Filter by type";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(val) => {
            const v = val as string;
            if (isMediaSort(v)) {
              setSearchParams({ sort: v as typeof sort });
            }
          }}
          value={sort}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {(value) => {
                const labels: Record<string, string> = {
                  createdAt_desc: "Newest first",
                  createdAt_asc: "Oldest first",
                  name_asc: "Name A-Z",
                  name_desc: "Name Z-A",
                };
                return labels[value as string] || "Sort by";
              }}
            </SelectValue>
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
                <TooltipTrigger
                  render={
                    <Button
                      aria-label={`Delete selected (${selectedItems.size})`}
                      onClick={onBulkDelete}
                      size="icon"
                      type="button"
                      variant="destructive"
                    />
                  }
                >
                  <TrashIcon aria-hidden="true" size={16} />
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
