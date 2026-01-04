"use client";

import {
  Files01Icon,
  Home01Icon,
  Image02Icon,
  Package01Icon,
  Settings01Icon,
  Tag01Icon,
  Users,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@marble/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: Files01Icon,
  },
  {
    name: "Categories",
    url: "categories",
    icon: Package01Icon,
  },
  {
    name: "Tags",
    url: "tags",
    icon: Tag01Icon,
  },
  {
    name: "Media",
    url: "media",
    icon: Image02Icon,
  },
  {
    name: "Authors",
    url: "authors",
    icon: Users,
  },
];

const settingsItems = [
  {
    title: "General",
    url: "settings/general",
  },
  {
    title: "Members",
    url: "settings/members",
  },
  {
    title: "Billing",
    url: "settings/billing",
  },
  {
    title: "Editor",
    url: "settings/editor",
  },
];

export function NavMain() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();

  const isActive = (url: string) => pathname === `/${params.workspace}/${url}`;

  const isOverviewActive = pathname === `/${params.workspace}`;
  const isSettingsActive = pathname.startsWith(`/${params.workspace}/settings`);

  return (
    <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
      <SidebarGroupLabel className="sr-only">Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuButton
          className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
            isOverviewActive
              ? "bg-sidebar-accent text-foreground"
              : "hover:text-accent-foreground"
          }`}
          render={
            <Link href={`/${params.workspace}`}>
              <HugeiconsIcon icon={Home01Icon} />
              <span>Home</span>
            </Link>
          }
        />
        {items.map((item) => (
          <SidebarMenuButton
            className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
              isActive(item.url)
                ? "hover bg-sidebar-accent text-foreground"
                : "hover:text-accent-foreground"
            }`}
            key={item.name}
            render={
              <Link href={`/${params.workspace}/${item.url}`}>
                <HugeiconsIcon icon={item.icon} />
                <span>{item.name}</span>
              </Link>
            }
          />
        ))}
        <Collapsible
          className="group/collapsible"
          open={isSettingsActive}
          render={<SidebarMenuItem />}
        >
          <CollapsibleTrigger
            nativeButton={false}
            render={
              <Link href={`/${params.workspace}/settings/general`}>
                <SidebarMenuButton
                  className={`cursor-pointer border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
                    isSettingsActive
                      ? "bg-sidebar-accent text-foreground"
                      : "hover:text-accent-foreground"
                  }`}
                  render={<div />}
                  tooltip="Settings"
                >
                  <HugeiconsIcon icon={Settings01Icon} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub>
              {settingsItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    className={
                      isActive(subItem.url)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                    render={
                      <Link href={`/${params.workspace}/${subItem.url}`}>
                        <span>{subItem.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
