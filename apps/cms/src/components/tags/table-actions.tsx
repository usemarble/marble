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
import type { Tag } from "./columns";
import { DeleteTagModal, TagModal } from "./tag-modals";

export default function TableActions(props: Tag) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsThreeVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              className="flex w-full items-center gap-2"
            >
              <PencilSimpleLine size={16} /> <span>Edit</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center gap-2"
            >
              <Trash size={16} /> <span>Delete</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagModal
        open={showUpdateModal}
        setOpen={setShowUpdateModal}
        mode="update"
        tagData={{ ...props }}
      />

      <DeleteTagModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        name={props.name}
        id={props.id}
      />
    </>
  );
}
