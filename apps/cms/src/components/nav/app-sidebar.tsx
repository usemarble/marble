"use client";

import { ArrowLeft01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
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
import { cn } from "@marble/ui/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { NavExtra } from "./nav-extra";
import { NavMain } from "./nav-main";
import { NavSettings } from "./nav-settings";
import { SidebarFooterContent } from "./sidebar-footer-content";
import { UpgradeCard } from "./upgrade-card";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();
  const isSettingsRoute = pathname.startsWith(`/${params.workspace}/settings`);

  const mainVariants = {
    initial: { opacity: 0, x: "-100%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "-100%" },
  };

  const settingsVariants = {
    initial: { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "100%" },
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
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuButton
                  className="border border-transparent transition-colors duration-200 hover:bg-sidebar-accent"
                  render={
                    <Link href={`/${params.workspace}`}>
                      <HugeiconsIcon icon={ArrowLeft01Icon} />
                      <span>Back</span>
                    </Link>
                  }
                  tooltip="Back"
                />
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <NavSettings />
            </SidebarContent>
            <SidebarFooter className="gap-0">
              <SidebarGroup className={cn(open ? "px-2" : "px-0")}>
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
              <WorkspaceSwitcher />
            </SidebarHeader>
            <SidebarContent>
              <NavMain />
            </SidebarContent>
            <SidebarFooter className="gap-0">
              <UpgradeCard />
              <SidebarGroup className={cn(open ? "px-2" : "px-0")}>
                <SidebarMenu>
                  <SidebarMenuButton
                    className="border border-transparent transition-colors duration-200 hover:bg-sidebar-accent hover:text-accent-foreground"
                    render={
                      <Link href={`/${params.workspace}/settings/general`}>
                        <HugeiconsIcon icon={Settings01Icon} />
                        <span>Settings</span>
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
