"use client";

import {
  CreditCardIcon,
  Edit02Icon,
  Key01Icon,
  PaintBoardIcon,
  Settings01Icon,
  UserCircleIcon,
  UserGroupIcon,
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
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const accountItems = [
  {
    name: "Profile",
    url: "settings/account",
    icon: UserCircleIcon,
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
    icon: UserGroupIcon,
  },
  {
    name: "Billing",
    url: "settings/billing",
    icon: CreditCardIcon,
  },
  {
    name: "Editor",
    url: "settings/editor",
    icon: Edit02Icon,
  },
];

const developerItems = [
  {
    name: "API Keys",
    url: "settings/keys",
    icon: Key01Icon,
  },
  {
    name: "Webhooks",
    url: "settings/webhooks",
    icon: WebhookIcon,
  },
];

export function NavSettings() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();

  const isActive = (url: string) => pathname === `/${params.workspace}/${url}`;

  return (
    <>
      <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarMenu>
          {accountItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link href={`/${params.workspace}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.name}</span>
                </Link>
              }
              tooltip={item.name}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Workspace Section */}
      <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          {workspaceItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link href={`/${params.workspace}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.name}</span>
                </Link>
              }
              tooltip={item.name}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Developers Section */}
      <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
        <SidebarGroupLabel>Developers</SidebarGroupLabel>
        <SidebarMenu>
          {developerItems.map((item) => (
            <SidebarMenuButton
              className={cn(
                "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
                isActive(item.url)
                  ? "bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              )}
              key={item.name}
              render={
                <Link href={`/${params.workspace}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.name}</span>
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
