"use client";

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
import type { Author } from "@/types/author";
import { DeleteAuthorModal } from "./author-modals";
import { AuthorSheet } from "./author-sheet";

interface AuthorTableActionsProps {
  author: Author;
}

export function AuthorTableActions({ author }: AuthorTableActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

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
          <DropdownMenuItem onClick={() => handleEdit()}>
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
            <span>Edit Author</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete()}
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span>Delete Author</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEditModal && (
        <AuthorSheet
          authorData={author}
          mode="update"
          open={showEditModal}
          setOpen={setShowEditModal}
        />
      )}

      <DeleteAuthorModal
        id={author.id}
        name={author.name}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
