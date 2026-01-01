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
  type ColumnDef,
  flexRender,
  type Table as TableType,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";

interface DataTableProps<TData, TValue> {
  table: TableType<TData>;
  columns: ColumnDef<TData, TValue>[];
}

export function DataTable<TData, TValue>({
  table,
  columns,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const handleRowClick = (post: Post, event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).closest('[data-actions-cell="true"]') ||
      (event.target as HTMLElement).closest("button") ||
      (event.target as HTMLElement).closest("a") ||
      (event.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      return;
    }
    router.push(`/${activeWorkspace?.slug}/editor/p/${post.id}`);
  };

  return (
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
                className="cursor-pointer hover:bg-muted/50"
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
                onClick={(event) => handleRowClick(row.original as Post, event)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    {...(cell.column.id === "actions" && {
                      "data-actions-cell": "true",
                      onClick: (e: React.MouseEvent) => e.stopPropagation(),
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-96 text-center" colSpan={columns.length}>
                No posts results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
