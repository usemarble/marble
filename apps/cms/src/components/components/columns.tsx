"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
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
        return <div className=" text-sm">No properties</div>;
      }

      // Show first 2 properties, then count
      const displayProps = properties.slice(0, 2);
      const remainingCount = properties.length - displayProps.length;

      return (
        <div className="flex flex-wrap gap-1 items-center">
          {displayProps.map((prop) => (
            <Badge key={prop.id} variant="secondary" className="text-xs">
              {prop.name}
              {prop.required && <span className="text-red-500 ml-1">*</span>}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <span className="text-xs ">+{remainingCount} more</span>
          )}
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
