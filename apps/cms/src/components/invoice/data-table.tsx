"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { cn } from "@marble/ui/lib/utils";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function InvoiceDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, _setSorting] = useState<SortingState>([]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const rows = table.getRowModel().rows;

  if (data.length === 0) {
    return (
      <div className="overflow-hidden rounded-[20px] bg-surface p-1">
        <div className="rounded-[16px] bg-background px-4 py-10 text-center shadow-xs">
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        </div>
      </div>
    );
  }

  return (
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
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                className="border-0 bg-background hover:bg-background/80 data-[state=selected]:bg-background"
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className={cn(getCellClassName(cell.column.id))}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="border-0 bg-background">
              <TableCell
                className="h-28 rounded-[16px] text-center text-muted-foreground text-sm"
                colSpan={table.getVisibleLeafColumns().length}
              >
                No invoices match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function getHeaderClassName(columnId: string) {
  switch (columnId) {
    case "date":
      return "px-3 text-muted-foreground";
    case "amount":
      return "px-3 text-muted-foreground";
    case "status":
      return "px-3 text-muted-foreground";
    case "actions":
      return "sr-only w-12 px-3 text-right text-muted-foreground";
    default:
      return "px-3 text-muted-foreground";
  }
}

function getCellClassName(columnId: string) {
  switch (columnId) {
    case "date":
      return "rounded-l-[16px] px-3 py-2 text-muted-foreground text-xs";
    case "amount":
      return "px-3 py-2 font-medium text-xs";
    case "status":
      return "px-3 py-2";
    case "actions":
      return "rounded-r-[16px] px-3 py-2";
    default:
      return "px-3 py-2";
  }
}
