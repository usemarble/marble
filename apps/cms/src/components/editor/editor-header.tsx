"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { SidebarTrigger } from "@marble/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { SidebarSimpleIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { ShareModal } from "./share-modal";

function getToggleSidebarShortcut() {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return isMac ? "⌘K" : "Ctrl+K";
}

type EditorHeaderProps = {
  postId?: string;
  workspace: string;
};

export function EditorHeader({ postId, workspace }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex justify-between p-3">
      <div className="flex items-center gap-4">
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "group"
              )}
              href={`/${workspace}/posts`}
            >
              <XIcon className="size-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Close Editor</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        {postId && <ShareModal postId={postId} />}
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <SidebarTrigger className="size-8 text-muted-foreground">
              <SidebarSimpleIcon className="size-4" />
            </SidebarTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Sidebar ({getToggleSidebarShortcut()})</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
