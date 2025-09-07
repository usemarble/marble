"use client";

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
import {
  FadersIcon,
  ImagesIcon,
  NoteIcon,
  PackageIcon,
  TagIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: NoteIcon,
  },
  {
    name: "Categories",
    url: "categories",
    icon: PackageIcon,
  },
  {
    name: "Tags",
    url: "tags",
    icon: TagIcon,
  },
  {
    name: "Media",
    url: "media",
    icon: ImagesIcon,
  },
  // {
  //   name: "Authors",
  //   url: "authors",
  //   icon: UsersThreeIcon,
  // },
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
  // {
  //   title: "Schemas",
  //   url: "settings/schemas",
  // },
];

export function NavMain() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();

  const isActive = (url: string) => {
    return pathname === `/${params.workspace}/${url}`;
  };

  const _isOverviewActive = pathname === `/${params.workspace}`;
  const isSettingsActive = pathname.startsWith(`/${params.workspace}/settings`);

  return (
    <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {/* <SidebarMenuButton
          asChild
          className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
            isOverviewActive
              ? "bg-sidebar-accent border-border text-foreground shadow-xs"
              : "hover:text-accent-foreground"
          }`}
        >
          <Link href={`/${params.workspace}`}>
            <Layout />
            <span>Overview</span>
          </Link>
        </SidebarMenuButton> */}
        {items.map((item) => (
          <SidebarMenuButton
            asChild
            key={item.name}
            className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
              isActive(item.url)
                ? "bg-sidebar-accent border-border text-foreground shadow-xs hover"
                : "hover:text-accent-foreground"
            }`}
          >
            <Link href={`/${params.workspace}/${item.url}`}>
              <item.icon />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        ))}
        <Collapsible
          asChild
          open={isSettingsActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <Link href={`/${params.workspace}/settings/general`}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Settings"
                  className={`border cursor-pointer border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
                    isSettingsActive
                      ? "bg-sidebar-accent border-border text-foreground shadow-xs"
                      : "hover:text-accent-foreground"
                  }`}
                >
                  <FadersIcon />
                  <span>Settings</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </Link>
            <CollapsibleContent>
              <SidebarMenuSub>
                {settingsItems.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      className={
                        isActive(subItem.url)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      <Link href={`/${params.workspace}/${subItem.url}`}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
