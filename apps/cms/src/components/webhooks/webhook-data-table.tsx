"use client";

import { WebhookIcon } from "@hugeicons/core-free-icons";
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
import { cn } from "@marble/ui/lib/utils";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import CreateWebhookSheet from "@/components/webhooks/create-webhook";
import type { Webhook } from "@/types/webhook";
import { getWebhookColumns } from "./webhook-columns";

interface WebhookDataTableProps {
  isToggling: boolean;
  onDelete: () => void;
  onToggle: (data: { id: string; enabled: boolean }) => void;
  toggleVariables?: { id: string; enabled: boolean };
  webhooks: Webhook[];
}

export function WebhookDataTable({
  isToggling,
  onDelete,
  onToggle,
  toggleVariables,
  webhooks,
}: WebhookDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () =>
      getWebhookColumns({
        isToggling,
        onDelete,
        onToggle,
        toggleVariables,
      }),
    [isToggling, onDelete, onToggle, toggleVariables]
  );

  const table = useReactTable({
    data: webhooks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase().trim();
      if (!search) {
        return true;
      }
      const webhook = row.original;
      return [
        webhook.name,
        webhook.url,
        webhook.format,
        webhook.enabled ? "enabled" : "disabled",
      ].some((value) => value.toLowerCase().includes(search));
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      rowSelection,
    },
  });

  const rows = table.getRowModel().rows;
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon
              className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Search webhooks"
              className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search webhooks..."
              value={globalFilter}
            />
            {globalFilter && (
              <button
                className="-translate-y-1/2 absolute top-1/2 right-3"
                onClick={() => setGlobalFilter("")}
                type="button"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="flex h-9 items-center rounded-lg bg-surface p-0.5">
              <Button
                className="h-8 rounded-md px-2 font-medium text-xs"
                onClick={() => table.resetRowSelection()}
                size="xs"
                type="button"
                variant="ghost"
              >
                <XIcon />
                {selectedCount} selected
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <CreateWebhookSheet>
            <Button className="h-9 w-full sm:w-auto">
              <PlusIcon className="size-4" />
              Add Endpoint
            </Button>
          </CreateWebhookSheet>
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
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  className="border-0 bg-background hover:bg-background/80 data-[state=selected]:bg-background"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={cn(getCellClassName(cell.column.id))}
                      data-no-row-click={
                        cell.column.id === "select" ||
                        cell.column.id === "toggle" ||
                        cell.column.id === "actions"
                          ? true
                          : undefined
                      }
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
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  No webhooks found. Try adjusting your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function WebhooksEmptyState() {
  return (
    <div className="grid min-h-[50vh] place-content-center rounded-[20px] bg-surface p-6 text-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-background">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={WebhookIcon}
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Webhooks let you run actions on your server when events happen in your
          workspace.
        </p>
        <CreateWebhookSheet>
          <Button>
            <PlusIcon className="size-4" />
            New Webhook
          </Button>
        </CreateWebhookSheet>
      </div>
    </div>
  );
}

function getHeaderClassName(columnId: string) {
  switch (columnId) {
    case "select":
      return "w-10 px-3";
    case "name":
      return "min-w-56 pr-3 text-muted-foreground";
    case "endpoint":
      return "min-w-80 px-3 text-muted-foreground";
    case "enabled":
      return "px-3 text-muted-foreground";
    case "toggle":
      return "px-3 text-muted-foreground";
    case "createdAt":
      return "hidden px-3 text-muted-foreground lg:table-cell";
    case "actions":
      return "sr-only w-12 px-3 text-right text-muted-foreground";
    default:
      return "px-3 text-muted-foreground";
  }
}

function getCellClassName(columnId: string) {
  switch (columnId) {
    case "select":
      return "rounded-l-[14px] px-3 py-2";
    case "name":
      return "px-3 py-2";
    case "endpoint":
      return "px-3 py-2";
    case "createdAt":
      return "hidden px-3 py-2 lg:table-cell";
    case "actions":
      return "rounded-r-[14px] px-3 py-2";
    default:
      return "px-3 py-2";
  }
}
