import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { cn } from "@marble/ui/lib/utils";
import {
  DotsThreeVerticalIcon,
  PencilSimpleLineIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";
import { DeletePostModal } from "./post-modals";

interface PostTableActionsProps {
  post: Post;
  view?: "table" | "grid";
}

export default function PostActions({
  post,
  view = "table",
}: PostTableActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { activeWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return null;
  }

  const handleCardButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  // if (view === "grid") {
  //   return (
  //     <>
  //       <Button
  //         type="button"
  //         className="size-8 text-foreground p-0 bg-secondary grid place-items-center rounded-full hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive transition"
  //         onClick={(e) => handleCardButtonClick(e)}
  //       >
  //         <TrashIcon size={16} />
  //       </Button>
  //       <DeletePostModal
  //         open={showDeleteModal}
  //         setOpen={setShowDeleteModal}
  //         id={post.id}
  //         mode={mode}
  //       />
  //     </>
  //   );
  // }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={cn(
                "size-8 p-0",
                view === "grid" &&
                  "rounded-full bg-surface hover:bg-primary/10 hover:text-primary dark:bg-accent/50 dark:hover:text-accent-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              variant="ghost"
            >
              <span className="sr-only">Open menu</span>
              <DotsThreeVerticalIcon size={16} weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent
          align={view === "grid" ? "center" : "end"}
          className="text-muted-foreground shadow-sm"
        >
          <DropdownMenuItem>
            <Link
              className="flex w-full cursor-default items-center gap-2"
              href={`/${activeWorkspace?.slug}/editor/p/${post.id}`}
            >
              <PencilSimpleLineIcon size={16} /> <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => handleCardButtonClick(e)}
            variant="destructive"
          >
            <TrashIcon size={16} /> <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostModal
        id={post.id}
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        view={view}
      />
    </>
  );
}
