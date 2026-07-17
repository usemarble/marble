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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { InviteButton } from "./invite-button";

type UserRole = "owner" | "admin" | "member" | undefined;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  currentUserRole: UserRole;
  currentUserId: string | undefined;
  setShowInviteModal: (open: boolean) => void;
  setShowLeaveWorkspaceModal: (open: boolean) => void;
}

export function TeamDataTable<TData, TValue>({
  columns,
  data,
  currentUserRole,
  currentUserId,
  setShowInviteModal,
  setShowLeaveWorkspaceModal,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    meta: {
      currentUserRole,
      currentUserId,
    },
  });

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
            placeholder="Search team members..."
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
          <InviteButton onInvite={() => setShowInviteModal(true)} />
          {currentUserRole === "owner" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  delay={0}
                  render={
                    <Button
                      className="cursor-not-allowed opacity-50"
                      variant="outline"
                    >
                      <span>Leave Team</span>
                    </Button>
                  }
                />
                <TooltipContent>
                  <p className="text-xs">
                    You cannot leave your own workspace.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={() => setShowLeaveWorkspaceModal(true)}
              variant="outline"
            >
              <span>Leave Team</span>
            </Button>
          )}
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
                  className="h-28 rounded-[14px] text-center text-muted-foreground text-sm"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
