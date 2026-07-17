"use client";

import { Users } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
  useReactTable,
} from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { useState } from "react";
import { usePlan } from "@/hooks/use-plan";
import type { Author } from "@/types/author";
import AuthorSheet from "./author-sheet";

const UpgradeModal = dynamic(() =>
  import("@/components/billing/upgrade-modal").then((mod) => mod.UpgradeModal)
);

interface AuthorDataTableProps {
  columns: ColumnDef<Author>[];
  data: Author[];
}

export function AuthorDataTable({ columns, data }: AuthorDataTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { planLimits } = usePlan();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const handleAddAuthor = () => {
    if (data.length >= planLimits.maxAuthors) {
      setShowUpgradeModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <MagnifyingGlassIcon
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            size={16}
          />
          <Input
            className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            placeholder="Search authors..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          />
          {(table.getColumn("name")?.getFilterValue() as string) && (
            <button
              className="-translate-y-1/2 absolute top-1/2 right-3"
              onClick={() => table.getColumn("name")?.setFilterValue("")}
              type="button"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button className="h-9 w-full sm:w-auto" onClick={handleAddAuthor}>
            <PlusIcon className="size-4" />
            <span>Add Author</span>
          </Button>
        </div>
      </section>

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
                    className={
                      header.column.id === "actions"
                        ? "w-12 px-3 text-right text-muted-foreground"
                        : "px-3 text-muted-foreground"
                    }
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="h-[60px] border-0 bg-background hover:bg-background/80 data-[state=selected]:bg-background"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className="px-3 py-2 first:rounded-l-[14px] last:rounded-r-[14px]"
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-0 bg-background">
                <TableCell
                  className="h-28 rounded-[14px] text-center"
                  colSpan={columns.length}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <HugeiconsIcon
                      className="size-12 text-muted-foreground"
                      icon={Users}
                    />
                    <p className="text-muted-foreground text-sm">
                      No authors found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuthorSheet
        mode="create"
        open={showCreateModal}
        setOpen={setShowCreateModal}
      />

      <UpgradeModal
        feature="authors"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
