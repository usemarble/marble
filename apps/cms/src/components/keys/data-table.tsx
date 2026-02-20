"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
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
import { ApiKeyModal } from "./api-key-modal";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, _setSorting] = useState<SortingState>([]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

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

  return (
    <div>
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <MagnifyingGlassIcon
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            size={16}
          />
          <Input
            className="w-full px-8 sm:w-72"
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            placeholder="Search API keys..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          />
          {(table.getColumn("name")?.getFilterValue() as string) && (
            <button
              className="absolute top-3 right-3"
              onClick={() => table.getColumn("name")?.setFilterValue("")}
              type="button"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon size={16} />
            <span>New API Key</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  No API keys to show.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ApiKeyModal
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />
    </div>
  );
}
