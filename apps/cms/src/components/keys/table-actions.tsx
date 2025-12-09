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
import { ApiKeyModal } from "./api-key-modal";
import type { APIKey } from "./columns";
import { DeleteKeyModal } from "./delete-key";

export default function TableActions(props: APIKey) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button className="h-8 w-8 p-0" variant="ghost" />}
        >
          <span className="sr-only">Open menu</span>
          <DotsThreeVerticalIcon />
        </DropdownMenuTrigger>
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

      <ApiKeyModal
        data={{ ...props }}
        mode="update"
        open={showUpdateModal}
        setOpen={setShowUpdateModal}
      />

      <DeleteKeyModal
        id={props.id}
        name={props.name}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
