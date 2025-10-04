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
import type { CustomComponent } from "./columns";
import { ComponentModal, DeleteComponentModal } from "./component-modals";

export default function ComponentTableActions(props: CustomComponent) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <PencilSimpleLineIcon className="mr-2" size={16} />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            variant="destructive"
          >
            <TrashIcon className="mr-2" size={16} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ComponentModal
        editingComponent={props}
        mode="update"
        open={showEditModal}
        setOpen={setShowEditModal}
      />

      <DeleteComponentModal
        component={{ name: props.name, id: props.id }}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
