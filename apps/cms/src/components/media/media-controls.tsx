import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { TrashIcon, UploadIcon, XIcon } from "@phosphor-icons/react";

export function MediaControls({ 
  type, 
  setType, 
  sort, 
  setSort, 
  onUpload,
  selectedItems,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  mediaLength,
}: {
  type?: string;
  setType: (type?: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  onUpload: () => void;
  selectedItems: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  mediaLength: number;
}) {
  return (
    <section className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Select
          value={type || "all"}
          onValueChange={(val) => setType(val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
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
            <Button onClick={onDeselectAll} size="icon" variant="outline">
              <XIcon size={16} />
            </Button>
          )}
          {mediaLength > 0 && ( 
            <Button onClick={onSelectAll} variant="outline">
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
                    onClick={onBulkDelete}
                    size="icon"
                    variant="destructive"
                  >
                    <TrashIcon size={16} />
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
      <div className="flex items-center gap-2">
        <Button onClick={onUpload}>
          <UploadIcon size={16} />
          <span>Upload Media</span>
        </Button>
      </div>
    </section>
  );
};
