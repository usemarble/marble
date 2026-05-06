"use client";

import {
  ArrowLeft01Icon,
  Settings01Icon,
  SidebarLeftIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@marble/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { NavExtra } from "./nav-extra";
import { NavMain } from "./nav-main";
import { NavSettings } from "./nav-settings";
import { SidebarFooterContent } from "./sidebar-footer-content";
import { WhatsNewCard } from "./whats-new-card";
import { WorkspaceSwitcher } from "./workspace-switcher";

function getToggleSidebarShortcut() {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return isMac ? "⌘K" : "Ctrl+K";
}

const sidebarToggleTransition = {
  bounce: 0.18,
  duration: 0.8,
  type: "spring",
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const isSettingsRoute = pathname.startsWith(`/${params.workspace}/settings`);

  const mainVariants = {
    initial: shouldReduceMotion
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: "-100%" },
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: "-100%" },
  };

  const settingsVariants = {
    initial: shouldReduceMotion
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: "100%" },
  };

  const transition = { duration: 0.3, type: "spring", bounce: 0.15 };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="overflow-hidden border-none"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {isSettingsRoute ? (
          <motion.div
            animate="animate"
            className="flex flex-1 flex-col"
            exit="exit"
            initial="initial"
            key="settings"
            transition={transition}
            variants={settingsVariants}
          >
            <SidebarHeader className={cn(!open && "items-center")}>
              <div
                className={cn(
                  "flex w-full min-w-0 items-center gap-2",
                  open ? "justify-between" : "justify-center"
                )}
              >
                <SidebarMenu className={cn(open ? "min-w-0 flex-1" : "w-auto")}>
                  <SidebarMenuButton
                    className={cn(
                      "h-9 border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                      !open && "justify-center gap-0"
                    )}
                    render={
                      <Link href={`/${params.workspace}`}>
                        <HugeiconsIcon icon={ArrowLeft01Icon} />
                        {open && <span>Back</span>}
                      </Link>
                    }
                    tooltip="Back"
                  />
                </SidebarMenu>
                <SidebarCollapseTrigger />
              </div>
            </SidebarHeader>
            <SidebarContent className="gap-0">
              <NavSettings />
            </SidebarContent>
            <SidebarFooter className="gap-0 p-0">
              <SidebarGroup className="px-3">
                <SidebarMenu>
                  <NavExtra asMenuButton />
                </SidebarMenu>
              </SidebarGroup>
            </SidebarFooter>
          </motion.div>
        ) : (
          <motion.div
            animate="animate"
            className="flex flex-1 flex-col"
            exit="exit"
            initial="initial"
            key="main"
            transition={transition}
            variants={mainVariants}
          >
            <SidebarHeader>
              <div
                className={cn(
                  "flex w-full min-w-0 items-center gap-2",
                  open ? "justify-between" : "justify-center"
                )}
              >
                <WorkspaceSwitcher />
                <SidebarCollapseTrigger />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <NavMain />
            </SidebarContent>
            <SidebarFooter className="gap-0 p-0">
              <WhatsNewCard />
              <SidebarGroup className="px-3">
                <SidebarMenu>
                  <SidebarMenuButton
                    className={cn(
                      "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent hover:text-accent-foreground",
                      !open && "justify-center gap-0"
                    )}
                    render={
                      <Link href={`/${params.workspace}/settings/general`}>
                        <HugeiconsIcon icon={Settings01Icon} />
                        {open && <span>Settings</span>}
                      </Link>
                    }
                    tooltip="Settings"
                  />
                </SidebarMenu>
              </SidebarGroup>
              <SidebarFooterContent />
            </SidebarFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Sidebar>
  );
}

function SidebarCollapseTrigger() {
  const { isMobile, open, toggleSidebar } = useSidebar();
  const motionProps = isMobile
    ? {
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        initial: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        initial: { opacity: 0 },
        transition: sidebarToggleTransition,
      };

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open && (
        <motion.div
          className="z-100 flex h-9 w-9 shrink-0 items-center justify-center"
          key="sidebar-sidebar-toggle"
          layoutId={isMobile ? undefined : "main-sidebar-toggle"}
          {...motionProps}
        >
          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <SidebarMenuButton
                  aria-label="Collapse sidebar"
                  className="h-9 w-9 shrink-0 cursor-pointer justify-center border border-transparent p-0"
                  onClick={toggleSidebar}
                  type="button"
                >
                  <HugeiconsIcon icon={SidebarLeftIcon} />
                </SidebarMenuButton>
              }
            />
            <TooltipContent>
              <p>Collapse Sidebar ({getToggleSidebarShortcut()})</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
