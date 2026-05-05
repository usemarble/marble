import { Button } from "@marble/ui/components/button";
import {
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

interface DataTablePaginationProps {
  canNextPage: boolean;
  canPreviousPage: boolean;
  onPageChange: (pageIndex: number) => void;
  pageCount: number;
  pageIndex: number;
  rowCount: number;
  selectedCount: number;
  totalCount: number;
  mediaCount: number;
}

export function DataTablePagination({
  canNextPage,
  canPreviousPage,
  onPageChange,
  pageCount,
  pageIndex,
  totalCount,
  mediaCount,
}: DataTablePaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const safePageIndex = Math.min(Math.max(0, pageIndex), safePageCount - 1);

  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-muted-foreground text-xs">
        Showing {mediaCount} of {totalCount} media item
        {totalCount === 1 ? "" : "s"}.
      </p>
      {/* <div className="flex-1 text-muted-foreground text-xs">
        {selectedCount} of {rowCount} row(s) selected.
      </div> */}
      <div className="flex items-center gap-2">
        <div className="flex w-[100px] items-center justify-center font-medium text-xs">
          Page {safePageIndex + 1} of {safePageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={!canPreviousPage}
            onClick={() => onPageChange(0)}
            variant="outline"
          >
            <span className="sr-only">Go to first page</span>
            <CaretDoubleLeftIcon />
          </Button>
          <Button
            className="h-8 w-8 p-0"
            disabled={!canPreviousPage}
            onClick={() => onPageChange(safePageIndex - 1)}
            variant="outline"
          >
            <span className="sr-only">Go to previous page</span>
            <CaretLeftIcon />
          </Button>
          <Button
            className="h-8 w-8 p-0"
            disabled={!canNextPage}
            onClick={() => onPageChange(safePageIndex + 1)}
            variant="outline"
          >
            <span className="sr-only">Go to next page</span>
            <CaretRightIcon />
          </Button>
          <Button
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={!canNextPage}
            onClick={() => onPageChange(safePageCount - 1)}
            variant="outline"
          >
            <span className="sr-only">Go to last page</span>
            <CaretDoubleRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
