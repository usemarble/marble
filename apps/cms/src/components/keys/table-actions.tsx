import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
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
          render={
            <Button className="size-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="text-muted-foreground shadow-sm"
        >
          <DropdownMenuItem onClick={() => setShowUpdateModal(true)}>
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span>Delete</span>
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
