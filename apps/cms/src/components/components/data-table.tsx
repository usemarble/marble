"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { DotsThree, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type {
  CreateComponentData,
  CustomComponent,
} from "@/app/(main)/[workspace]/(workspace)/components/page-client";
import { ComponentModals } from "./component-modals";

interface ComponentsDataTableProps {
  data: CustomComponent[];
  isLoading: boolean;
  onUpdate: (id: string, data: CreateComponentData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ComponentsDataTable({
  data,
  isLoading,
  onUpdate,
  onDelete,
}: ComponentsDataTableProps) {
  const [editingComponent, setEditingComponent] =
    useState<CustomComponent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = (component: CustomComponent) => {
    setEditingComponent(component);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (componentData: CreateComponentData) => {
    if (editingComponent) {
      await onUpdate(editingComponent.id, componentData);
      setShowEditModal(false);
      setEditingComponent(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No custom components found. Create your first component to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">
                    {component.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {component.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {component.properties.map((prop) => (
                        <Badge
                          key={prop.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {prop.name}: {prop.type}
                          {prop.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(component.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <DotsThree className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(component)}>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(component.id)}
                          className="text-destructive"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ComponentModals
        showEditModal={showEditModal}
        onEditClose={() => {
          setShowEditModal(false);
          setEditingComponent(null);
        }}
        onEdit={handleEditSubmit}
        editingComponent={editingComponent}
      />
    </>
  );
}
