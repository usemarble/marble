"use client";

import { Badge } from "@marble/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { ApiScope } from "@/utils/keys";
import TableActions from "./table-actions";

export interface APIKey {
  id: string;
  name: string;
  preview: string;
  type: "public" | "private";
  scopes: ApiScope[];
  requestCount: number;
  enabled: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export const columns: ColumnDef<APIKey>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={type === "public" ? "info" : "pending"}>
          {type === "public" ? "Public" : "Private"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "preview",
    header: "Key",
    cell: ({ row }) => {
      const preview = row.original.preview;
      return <span className="font-mono text-sm">{preview}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(row.original.createdAt, "MMM dd, yyyy"),
  },
  {
    accessorKey: "lastUsed",
    header: "Last Used",
    cell: ({ row }) => {
      const lastUsed = row.original.lastUsed;
      return lastUsed ? format(lastUsed, "MMM dd, yyyy") : "Never";
    },
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const apiKey = row.original;

      return (
        <div className="flex justify-end pr-10">
          <TableActions {...apiKey} />
        </div>
      );
    },
  },
];
