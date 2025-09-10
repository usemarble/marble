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
import { AuthorModal, DeleteAuthorModal } from "./author-modals";

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
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-8 p-0 data-[state=open]:bg-muted"
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

      <AuthorModal
        open={showEditModal}
        setOpen={setShowEditModal}
        mode="update"
        authorData={author}
      />

      <DeleteAuthorModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        id={author.id}
        name={author.name}
      />
    </>
  );
}
