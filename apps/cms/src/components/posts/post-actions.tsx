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
import { cn } from "@marble/ui/lib/utils";
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
              <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
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
              <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => handleCardButtonClick(e)}
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span>Delete</span>
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
