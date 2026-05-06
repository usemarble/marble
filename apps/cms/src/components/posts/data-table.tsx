"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import {
  flexRender,
  type Row,
  type Table as TableType,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";

export interface DataTableProps<TData> {
  table: TableType<TData>;
  rows: Row<TData>[];
}

export function DataTable<TData>({ table, rows }: DataTableProps<TData>) {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const shouldIgnoreRowClick = (event: MouseEvent) => {
    const target = event.target;
    return (
      target instanceof HTMLElement &&
      Boolean(
        target.closest(
          "button, a, input, textarea, select, [data-no-row-click], [role='button'], [role='checkbox'], [role='menuitem']"
        )
      )
    );
  };

  const handleRowClick = (post: Post, event: MouseEvent) => {
    if (
      shouldIgnoreRowClick(event) ||
      (event.target as HTMLElement).closest('[data-actions-cell="true"]')
    ) {
      return;
    }
    router.push(`/${activeWorkspace?.slug}/editor/p/${post.id}`);
  };

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
          {rows?.length ? (
            rows.map((row) => (
              <TableRow
                className="cursor-pointer border-0 bg-background hover:bg-background/80 data-[state=selected]:bg-background"
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
                onClick={(event) => handleRowClick(row.original as Post, event)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className={getCellClassName(cell.column.id)}
                    data-no-row-click={
                      cell.column.id === "actions" ? true : undefined
                    }
                    key={cell.id}
                    {...(cell.column.id === "actions" && {
                      "data-actions-cell": "true",
                      onClick: (e: MouseEvent) => e.stopPropagation(),
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                No posts found. Try adjusting your filters.
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
    case "title":
      return "min-w-72 pr-3 text-muted-foreground";
    case "status":
      return "px-3 text-muted-foreground";
    case "publishedAt":
    case "updatedAt":
      return "hidden px-3 text-muted-foreground md:table-cell";
    case "actions":
      return "sr-only w-12 px-3 text-right text-muted-foreground";
    default:
      return "px-3 text-muted-foreground";
  }
}

function getCellClassName(columnId: string) {
  switch (columnId) {
    case "title":
      return "rounded-l-[14px] px-3 py-2";
    case "publishedAt":
    case "updatedAt":
      return "hidden px-3 py-2 md:table-cell";
    case "actions":
      return "rounded-r-[14px] px-3 py-2";
    default:
      return "px-3 py-2";
  }
}
