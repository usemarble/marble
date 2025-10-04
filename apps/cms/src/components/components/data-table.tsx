"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { TooltipProvider } from "@marble/ui/components/tooltip";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ComponentModal } from "./component-modals";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ComponentsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute top-3 left-3 size-4 text-muted-foreground"
            size={16}
          />
          <Input
            className="w-72 px-8"
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            placeholder="Search descriptions..."
            value={
              (table.getColumn("description")?.getFilterValue() as string) ?? ""
            }
          />
          {(table.getColumn("description")?.getFilterValue() as string) && (
            <button
              className="absolute top-3 right-3"
              onClick={() => table.getColumn("description")?.setFilterValue("")}
              type="button"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <TooltipProvider>
          <Button
            className={buttonVariants({ variant: "default" })}
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon size={16} />
            <span>New Component</span>
          </Button>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-96 text-center"
                  colSpan={columns.length}
                >
                  No components to show.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ComponentModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </div>
  );
}
