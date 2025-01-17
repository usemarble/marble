import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Post } from "./columns";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { useState } from "react";
import { DeletePostModal } from "./post-modals";
import { useRouter } from "next/navigation";

export default function PostTableActions(props: Post) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

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
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => router.push(`/editor/${props.id}`)}
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

      <DeletePostModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        id={props.id}
      />
    </>
  );
}
