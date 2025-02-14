import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Category } from "./columns";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { useState } from "react";
import { DeleteCategoryModal, UpdateCategoryModal } from "./category-modals";

export default function TableActions(props: Category) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              className="flex w-full items-center gap-2"
            >
              <Pencil size={16} /> <span>Edit</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center gap-2 text-destructive"
            >
              <Trash2 size={16} /> <span>Delete</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateCategoryModal
        open={showUpdateModal}
        setOpen={setShowUpdateModal}
        categoryData={{ ...props }}
      />

      <DeleteCategoryModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        name={props.name}
        id={props.id}
      />
    </>
  );
}
