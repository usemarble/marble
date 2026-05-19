"use client";

import { Badge } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

export interface Invoice {
  id: string;
  plan: string;
  amount: number;
  status: "Success" | "Failed";
  date: string;
}

export const invoiceTableColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={cn("rounded-[6px] text-xs", {
            "border-emerald-300 bg-emerald-50 text-emerald-500":
              status === "Success",
            "border-red-300 bg-red-50 text-red-500": status === "Failed",
          })}
          variant="outline"
        >
          {status === "Success" ? "Success" : "Failed"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div className="flex justify-end">
          <TableActions {...invoice} />
        </div>
      );
    },
    enableSorting: false,
  },
];
