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
import { CategoryModal, DeleteCategoryModal } from "./category-modals";
import type { Category } from "./columns";

export default function TableActions(props: Category) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
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
          <DropdownMenuItem onClick={() => setShowUpdateModal(true)}>
            <PencilSimpleLineIcon className="mr-1.5 size-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            variant="destructive"
          >
            <TrashIcon className="mr-1.5 size-4" /> <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showUpdateModal && (
        <CategoryModal
          categoryData={{ ...props }}
          mode="update"
          open={showUpdateModal}
          setOpen={setShowUpdateModal}
        />
      )}

      <DeleteCategoryModal
        id={props.id}
        name={props.name}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
