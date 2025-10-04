"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import TableActions from "./table-actions";

export type CustomComponent = {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  properties: ComponentProperty[];
};

export type ComponentProperty = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  options?: Array<{ label: string; value: string }>;
};

export const columns: ColumnDef<CustomComponent>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="max-w-48 truncate">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-48 truncate">
        {row.getValue("description") || "No description"}
      </div>
    ),
  },
  {
    accessorKey: "properties",
    header: "Properties",
    cell: ({ row }) => {
      const properties = row.getValue(
        "properties"
      ) as CustomComponent["properties"];

      if (!properties || properties.length === 0) {
        return <div className="text-sm">No properties</div>;
      }

      const total = properties.length;

      if (total === 1) {
        const p = properties[0];
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              className="gap-x-0.5 text-xs"
              key={p?.id}
              variant="secondary"
            >
              {p?.name}
              {p?.required && <span className="text-red-500">*</span>}
            </Badge>
          </div>
        );
      }

      if (total === 2) {
        const [p1, p2] = properties;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {[p1, p2].map((p) => (
              <Badge
                className="gap-x-0.5 text-xs"
                key={p?.id}
                variant="secondary"
              >
                {p?.name}
                {p?.required && <span className="text-red-500">*</span>}
              </Badge>
            ))}
          </div>
        );
      }

      const first = properties[0];
      const remaining = properties.slice(1);
      const remainingCount = remaining.length;

      return (
        <div className="flex flex-wrap items-center gap-1">
          <Badge
            className="gap-x-0.5 text-xs"
            key={first?.id}
            variant="secondary"
          >
            {first?.name}
            {first?.required && <span className="text-red-500">*</span>}
          </Badge>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="cursor-default gap-x-0.5 text-xs"
                  key={`${row.original.id}-props-remaining`}
                  variant="secondary"
                >
                  +{remainingCount} more
                </Badge>
              </TooltipTrigger>
              <TooltipContent align="start" className="p-2" side="bottom">
                <div className="flex max-w-[320px] flex-wrap gap-1">
                  {remaining.map((p) => (
                    <Badge
                      className="gap-x-0.5 text-xs"
                      key={p.id}
                      variant="secondary"
                    >
                      {p.name}
                      {p.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          className="h-auto p-0 font-medium hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Created
          <CaretUpDownIcon className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="">
        {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const component = row.original;

      return (
        <div className="flex justify-end pr-10">
          <TableActions {...component} />
        </div>
      );
    },
  },
];
