"use client";

import {
  Cancel01Icon,
  SidebarRight01Icon,
  SidebarRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

interface EditorHeaderProps {
  postId?: string;
  workspace: string;
}

export function EditorHeader({ postId, workspace }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex justify-between p-3">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger
            delay={10}
            render={
              <Link
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "group"
                )}
                href={`/${workspace}/posts`}
              >
                <HugeiconsIcon icon={Cancel01Icon} />
              </Link>
            }
          />
          <TooltipContent>
            <p>Close Editor</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        {postId && <ShareModal postId={postId} />}
        <Tooltip delay={400}>
          <TooltipTrigger
            render={
              <SidebarTrigger className="size-8">
                <HugeiconsIcon icon={SidebarRightIcon} />
              </SidebarTrigger>
            }
          />
          <TooltipContent>
            <p>Toggle Sidebar ({getToggleSidebarShortcut()})</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
