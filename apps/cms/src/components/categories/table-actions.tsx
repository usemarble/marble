import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  DotsThreeVertical,
  PencilSimpleLine,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { DeleteCategoryModal, UpdateCategoryModal } from "./category-modals";
import type { Category } from "./columns";

export default function TableActions(props: Category) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <DotsThreeVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem>
            <button
              className="flex w-full items-center gap-2"
              onClick={() => setShowUpdateModal(true)}
              type="button"
            >
              <PencilSimpleLine size={16} /> <span>Edit</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              className="flex w-full items-center gap-2"
              onClick={() => setShowDeleteModal(true)}
              type="button"
            >
              <Trash size={16} /> <span>Delete</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateCategoryModal
        categoryData={{ ...props }}
        open={showUpdateModal}
        setOpen={setShowUpdateModal}
      />

      <DeleteCategoryModal
        id={props.id}
        name={props.name}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
