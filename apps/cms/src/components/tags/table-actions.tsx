import { MoreHorizontal, Pencil, Trash, Trash2 } from "lucide-react";
import type { Tag } from "./columns";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { useState } from "react";
import { DeleteTagModal, UpdateTagModal } from "./tag-modals";

export default function TableActions(props: Tag) {
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
        <DropdownMenuContent align="end" className="text-muted-foreground">
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
              className="flex w-full items-center gap-2"
            >
              <Trash size={16} /> <span>Delete</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateTagModal
        open={showUpdateModal}
        setOpen={setShowUpdateModal}
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
