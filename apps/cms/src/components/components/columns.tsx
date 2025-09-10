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

export interface CustomComponent {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  properties: ComponentProperty[];
}

export interface ComponentProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  options?: Array<{ label: string; value: string }>;
}

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
        "properties",
      ) as CustomComponent["properties"];

      if (!properties || properties.length === 0) {
        return <div className="text-sm">No properties</div>;
      }

      const total = properties.length;

      if (total === 1) {
        const p = properties[0];
        return (
          <div className="flex flex-wrap gap-1 items-center">
            <Badge
              key={p?.id}
              variant="secondary"
              className="text-xs gap-x-0.5"
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
          <div className="flex flex-wrap gap-1 items-center">
            {[p1, p2].map((p) => (
              <Badge
                key={p?.id}
                variant="secondary"
                className="text-xs gap-x-0.5"
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
        <div className="flex flex-wrap gap-1 items-center">
          <Badge
            key={first?.id}
            variant="secondary"
            className="text-xs gap-x-0.5"
          >
            {first?.name}
            {first?.required && <span className="text-red-500">*</span>}
          </Badge>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  key={`${row.original.id}-props-remaining`}
                  variant="secondary"
                  className="text-xs gap-x-0.5 cursor-default"
                >
                  +{remainingCount} more
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="p-2">
                <div className="flex flex-wrap gap-1 max-w-[320px]">
                  {remaining.map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="text-xs gap-x-0.5"
                    >
                      {p.name}
                      {p.required && (
                        <span className="text-red-500 ml-1">*</span>
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
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
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
