"use client";

import { Badge } from "@marble/ui/components/badge";
import { Checkbox } from "@marble/ui/components/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Webhook } from "@/types/webhook";
import { WebhookActions } from "./webhook-actions";

interface WebhookColumnsOptions {
  isToggling: boolean;
  onDelete: () => void;
  onToggle: (data: { id: string; enabled: boolean }) => void;
  toggleVariables?: { id: string; enabled: boolean };
}

function formatWebhookFormat(formatValue: string) {
  return formatValue.toUpperCase();
}

export function getWebhookColumns({
  isToggling,
  onDelete,
  onToggle,
  toggleVariables,
}: WebhookColumnsOptions): ColumnDef<Webhook>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-checked={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
              ? "mixed"
              : undefined
          }
          aria-label={
            table.getIsAllPageRowsSelected() ? "Deselect all" : "Select all"
          }
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-0 max-w-64">
          <p className="truncate font-medium text-xs">{row.original.name}</p>
          <p className="text-muted-foreground text-xs">
            {formatWebhookFormat(row.original.format)}
          </p>
        </div>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "url",
      header: "Endpoint",
      cell: ({ row }) => (
        <p className="max-w-80 truncate break-all font-mono text-muted-foreground text-xs">
          {row.original.url}
        </p>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className="rounded-[6px] text-xs"
          variant={row.original.enabled ? "positive" : "neutral"}
        >
          {row.original.enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const webhook = row.original;
        const isCurrentlyToggling =
          isToggling && toggleVariables?.id === webhook.id;

        return (
          <div className="flex justify-end">
            <WebhookActions
              isToggling={isCurrentlyToggling}
              onDelete={onDelete}
              onToggle={onToggle}
              webhook={webhook}
            />
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
      size: 48,
    },
  ];
}
