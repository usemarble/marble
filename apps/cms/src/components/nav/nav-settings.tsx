"use client";

import {
  CreditCardIcon,
  DatabaseIcon,
  Key01Icon,
  Notification01Icon,
  PaintBoardIcon,
  Settings01Icon,
  UserIcon,
  UserMultipleIcon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import { prefetchDashboardRoute } from "@/lib/dashboard-prefetch";
import { useWorkspace } from "@/providers/workspace";
import { workspacePath } from "@/utils/workspace/url";

const accountItems = [
  {
    name: "Profile",
    url: "settings/account",
    icon: UserIcon,
  },
  {
    name: "Notifications",
    url: "settings/notifications",
    icon: Notification01Icon,
  },
  {
    name: "Appearance",
    url: "settings/appearance",
    icon: PaintBoardIcon,
  },
];

const workspaceItems = [
  {
    name: "General",
    url: "settings/general",
    icon: Settings01Icon,
  },
  {
    name: "Members",
    url: "settings/members",
    icon: UserMultipleIcon,
  },
  {
    name: "Billing",
    url: "settings/billing",
    icon: CreditCardIcon,
  },
];

const developerItems = [
  {
    name: "API Keys",
    url: "settings/keys",
    icon: Key01Icon,
  },
  {
    name: "Custom Fields",
    url: "settings/fields",
    icon: DatabaseIcon,
  },
  {
    name: "Webhooks",
    url: "settings/webhooks",
    icon: WebhookIcon,
  },
];

export function NavSettings() {
  const segments = useSelectedLayoutSegments();
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const { open } = useSidebar();

  const activeUrl = segments
    .filter((segment) => !segment.startsWith("("))
    .join("/");
  const isActive = (url: string) => activeUrl === url;
  const prefetchRoute = (url: string) => {
    if (activeWorkspace?.id) {
      prefetchDashboardRoute(queryClient, activeWorkspace.id, url).catch(
        () => undefined
      );
    }
  };

  return (
    <>
      {/* Workspace Section */}
      <SidebarGroup className="px-3">
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          {workspaceItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                !open && "justify-center gap-0",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link
                  href={workspacePath(params.workspace, item.url)}
                  onFocus={() => prefetchRoute(item.url)}
                  onMouseEnter={() => prefetchRoute(item.url)}
                >
                  <HugeiconsIcon icon={item.icon} />
                  {open && <span>{item.name}</span>}
                </Link>
              }
              tooltip={item.name}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Developers Section */}
      <SidebarGroup className="px-3">
        <SidebarGroupLabel>Developers</SidebarGroupLabel>
        <SidebarMenu>
          {developerItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                !open && "justify-center gap-0",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link
                  href={workspacePath(params.workspace, item.url)}
                  onFocus={() => prefetchRoute(item.url)}
                  onMouseEnter={() => prefetchRoute(item.url)}
                >
                  <HugeiconsIcon icon={item.icon} />
                  {open && <span>{item.name}</span>}
                </Link>
              }
              tooltip={item.name}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Account Section */}
      <SidebarGroup className="px-3">
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarMenu>
          {accountItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                !open && "justify-center gap-0",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link
                  href={workspacePath(params.workspace, item.url)}
                  onFocus={() => prefetchRoute(item.url)}
                  onMouseEnter={() => prefetchRoute(item.url)}
                >
                  <HugeiconsIcon icon={item.icon} />
                  {open && <span>{item.name}</span>}
                </Link>
              }
              tooltip={item.name}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
