"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  DotsThreeVerticalIcon,
  PencilSimpleLineIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { CustomField } from "@/types/fields";
import { DeleteCustomFieldModal } from "./delete-custom-field";
import { EditCustomFieldSheet } from "./edit-custom-field";

interface CustomFieldRowProps {
  field: CustomField;
  fieldTypeLabels: Record<string, string>;
  onDelete: () => void;
}

export function CustomFieldRow({
  field,
  fieldTypeLabels,
  onDelete,
}: CustomFieldRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <tr className="border-b transition-colors last:border-b-0 hover:bg-muted/50">
        <td className="px-4 py-3 font-medium text-sm">{field.name}</td>
        <td className="px-4 py-3 text-sm">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {field.key}
          </code>
        </td>
        <td className="px-4 py-3 text-muted-foreground text-sm">
          {fieldTypeLabels[field.type] || field.type}
        </td>
        <td className="px-4 py-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="h-8 w-8 p-0" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <DotsThreeVerticalIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="text-muted-foreground">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <PencilSimpleLineIcon className="mr-1.5 size-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                variant="destructive"
              >
                <TrashIcon className="mr-1.5 size-4" /> <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {isEditOpen && (
        <EditCustomFieldSheet
          field={field}
          onOpenChange={setIsEditOpen}
          open={isEditOpen}
        />
      )}

      <DeleteCustomFieldModal
        fieldId={field.id}
        fieldName={field.name}
        isOpen={isDeleteOpen}
        onDelete={onDelete}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
