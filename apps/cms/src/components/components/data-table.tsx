"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { Badge } from "@marble/ui/components/badge";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { Input } from "@marble/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { TooltipProvider } from "@marble/ui/components/tooltip";
import {
  CaretUpDownIcon,
  DotsThreeVerticalIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomComponent } from "@/app/(main)/[workspace]/(workspace)/components/page-client";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { ComponentModal } from "./component-modals";

interface ComponentsDataTableProps {
  data: CustomComponent[];
}

const columns: ColumnDef<CustomComponent>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-48 truncate">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-48 truncate">
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
        return (
          <div className="text-muted-foreground text-sm">No properties</div>
        );
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
            <span className="text-xs text-muted-foreground">
              +{remainingCount} more
            </span>
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
      <div className="text-muted-foreground">
        {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    cell: ({ row }) => {
      const component = row.original;
      return <ActionsCell component={component} />;
    },
  },
];

function ActionsCell({ component }: { component: CustomComponent }) {
  const [editingComponent, setEditingComponent] =
    useState<CustomComponent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleEdit = (component: CustomComponent) => {
    setEditingComponent(component);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const { mutate: deleteComponent } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/custom-components/${component.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete component");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Component deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_COMPONENTS(workspaceId),
        });
      }
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete component",
      );
    },
  });

  return (
    <>
      <div className="flex justify-end pr-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsThreeVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-muted-foreground">
            <DropdownMenuItem onClick={() => handleEdit(component)}>
              <PencilIcon className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <TrashIcon className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ComponentModal
        open={showEditModal}
        setOpen={(open) => {
          setShowEditModal(open);
          if (!open) setEditingComponent(null);
        }}
        mode="update"
        editingComponent={editingComponent}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{component.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteComponent()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ComponentsDataTable({ data }: ComponentsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4 justify-between">
        <div className="relative">
          <MagnifyingGlassIcon
            size={16}
            className="text-muted-foreground size-4 absolute top-3 left-3"
          />
          <Input
            value={
              (table.getColumn("description")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            placeholder="Search descriptions..."
            className="px-8 w-72"
          />
          {(table.getColumn("description")?.getFilterValue() as string) && (
            <button
              type="button"
              onClick={() => table.getColumn("description")?.setFilterValue("")}
              className="absolute right-3 top-3"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <TooltipProvider>
          <Button
            onClick={() => setShowCreateModal(true)}
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon size={16} />
            <span>New Component</span>
          </Button>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-96 text-center"
                >
                  No components to show.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ComponentModal
        open={showCreateModal}
        setOpen={setShowCreateModal}
        mode="create"
      />
    </div>
  );
}
