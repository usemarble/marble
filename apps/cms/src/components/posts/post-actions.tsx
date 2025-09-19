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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { Post } from "./columns";
import { DeletePostModal } from "./post-modals";

export default function PostTableActions(props: Post) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const params = useParams<{ workspace: string }>();

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
          <DropdownMenuItem>
            <Link
              href={`/${params.workspace}/editor/p/${props.id}`}
              className="flex w-full items-center gap-2 cursor-default"
            >
              <PencilSimpleLineIcon size={16} /> <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            <TrashIcon size={16} /> <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        id={props.id}
      />
    </>
  );
}
