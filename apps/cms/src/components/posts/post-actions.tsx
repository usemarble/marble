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

type PostTableActionsProps = {
  post: Post;
  view?: "table" | "grid";
};

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
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "size-8 p-0",
              view === "grid" &&
                "rounded-full bg-sidebar hover:text-primary dark:hover:text-accent-foreground hover:bg-primary/10 dark:bg-accent/50"
            )}
          >
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon size={16} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={view === "grid" ? "center" : "end"}
          className="text-muted-foreground shadow-sm"
        >
          <DropdownMenuItem>
            <Link
              href={`/${activeWorkspace?.slug}/editor/p/${post.id}`}
              className="flex w-full items-center gap-2 cursor-default"
            >
              <PencilSimpleLineIcon size={16} /> <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => handleCardButtonClick(e)}
          >
            <TrashIcon size={16} /> <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        id={post.id}
        view={view}
      />
    </>
  );
}
