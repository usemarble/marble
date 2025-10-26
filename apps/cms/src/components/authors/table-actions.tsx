"use client";

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
import type { Author } from "@/types/author";
import { DeleteAuthorModal } from "./author-modals";
import { AuthorSheet } from "./author-sheet";

type AuthorTableActionsProps = {
  author: Author;
};

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
        <DropdownMenuTrigger asChild>
          <Button
            className="size-8 p-0 data-[state=open]:bg-muted"
            variant="ghost"
          >
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem onClick={() => handleEdit()}>
            <PencilSimpleLineIcon className="size-4" />
            Edit Author
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete()}
            variant="destructive"
          >
            <TrashIcon className="size-4" />
            Delete Author
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthorSheet
        authorData={author}
        mode="update"
        open={showEditModal}
        setOpen={setShowEditModal}
      />

      <DeleteAuthorModal
        id={author.id}
        name={author.name}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
      />
    </>
  );
}
