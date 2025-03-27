"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@marble/ui/components/sidebar";

import {
  Group,
  ImageIcon,
  SlidersHorizontal,
  Tags,
} from "@marble/ui/lib/icons";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayersIcon } from "../icons/animated/layers";
import { LayoutPanelTopIcon } from "../icons/animated/layout-panel-top";
import { UsersIcon } from "../icons/animated/users";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: LayersIcon,
  },
  {
    name: "Categories",
    url: "categories",
    icon: Group,
  },
  {
    name: "Tags",
    url: "tags",
    icon: Tags,
  },
  {
    name: "Media",
    url: "media",
    icon: ImageIcon,
  },
  {
    name: "Team",
    url: "team",
    icon: UsersIcon,
  },
  {
    name: "Settings",
    url: "settings",
    icon: SlidersHorizontal,
  },
];

export function NavMain() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();

  const isActive = (url: string) => {
    return pathname === `/${params.workspace}/${url}`;
  };

  const isOverviewActive = pathname === `/${params.workspace}`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuButton
          asChild
          className={`border border-transparent ${
            isOverviewActive
              ? "bg-background border-border hover:bg-background text-primary hover:text-primary"
              : "hover:bg-background hover:border-border"
          }`}
        >
          <Link href={`/${params.workspace}`}>
            <LayoutPanelTopIcon />
            <span>Overview</span>
          </Link>
        </SidebarMenuButton>
        {items.map((item) => (
          <SidebarMenuButton
            asChild
            key={item.name}
            className={`border border-transparent ${
              isActive(item.url)
                ? "bg-background border-border hover:bg-background hover:text-primary text-primary"
                : "hover:bg-background hover:border-border"
            }`}
          >
            <Link href={`/${params.workspace}/${item.url}`}>
              <item.icon />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
