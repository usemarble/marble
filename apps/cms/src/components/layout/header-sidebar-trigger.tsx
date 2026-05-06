"use client";

import { Separator } from "@marble/ui/components/separator";
import { SidebarTrigger, useSidebar } from "@marble/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { AnimatePresence, motion } from "motion/react";

const sidebarToggleTransition = {
  bounce: 0.18,
  duration: 0.8,
  type: "spring",
} as const;

function getToggleSidebarShortcut() {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return isMac ? "⌘K" : "Ctrl+K";
}

export function HeaderSidebarTrigger() {
  const { isMobile, open } = useSidebar();
  const showSidebarTrigger = isMobile || !open;

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {showSidebarTrigger && (
        <motion.div
          animate={{ opacity: 1 }}
          className="z-100 flex items-center gap-2 px-4 md:px-0"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key="header-sidebar-toggle"
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="-ml-1 flex size-8 shrink-0 items-center justify-center"
            layoutId="main-sidebar-toggle"
            transition={sidebarToggleTransition}
          >
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <SidebarTrigger
                    className="size-8 text-sidebar-foreground"
                    variant="ghost"
                  />
                }
              />
              <TooltipContent>
                <p>Open Sidebar ({getToggleSidebarShortcut()})</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
          <Separator className="my-auto mr-2 h-4" orientation="vertical" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
