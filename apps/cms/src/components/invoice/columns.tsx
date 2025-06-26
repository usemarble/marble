"use client";

import { Badge } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

export type Invoice = {
  id: string;
  plan: string;
  amount: number;
  status: "Success" | "Failed";
  date: string;
};

export const invoiceTableColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "plan",
    header: "Plan",
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
          variant="outline"
          className={cn("rounded-[6px] w-full text-center justify-center", {
            "bg-emerald-50 text-emerald-500 border-emerald-300":
              status === "Success",
            "bg-red-50 text-red-500 border-red-300":
              status === "Failed",
          })}
        >
          {status === "Success" ? "Success" : "Failed"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div className="flex justify-end pr-10">
          <TableActions {...invoice} />
        </div>
      );
    },
  },
];
