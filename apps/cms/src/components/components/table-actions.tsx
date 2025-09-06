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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <PencilSimpleLineIcon size={16} className="mr-2" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            <TrashIcon size={16} className="mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ComponentModal
        open={showEditModal}
        setOpen={setShowEditModal}
        mode="update"
        editingComponent={props}
      />

      <DeleteComponentModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        component={{ name: props.name, id: props.id }}
      />
    </>
  );
}
