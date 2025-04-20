"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@marble/ui/components/sidebar";
import {
  Faders,
  Image as ImageIcon,
  Layout,
  Note,
  Package,
  Tag,
  Users,
  UsersThree,
} from "@phosphor-icons/react";

import { Group, SlidersHorizontal, Tags } from "@marble/ui/lib/icons";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayersIcon } from "../icons/animated/layers";
import { LayoutPanelTopIcon } from "../icons/animated/layout-panel-top";
import { UsersIcon } from "../icons/animated/users";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: Note,
  },
  {
    name: "Categories",
    url: "categories",
    icon: Package,
  },
  {
    name: "Tags",
    url: "tags",
    icon: Tag,
  },
  {
    name: "Media",
    url: "media",
    icon: ImageIcon,
  },
  {
    name: "Team",
    url: "team",
    icon: UsersThree,
  },
  {
    name: "Settings",
    url: "settings",
    icon: Faders,
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
          className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
            isOverviewActive
              ? "bg-sidebar-accent border-border text-foreground shadow-sm"
              : "hover:text-accent-foreground"
          }`}
        >
          <Link href={`/${params.workspace}`}>
            <Layout />
            <span>Overview</span>
          </Link>
        </SidebarMenuButton>
        {items.map((item) => (
          <SidebarMenuButton
            asChild
            key={item.name}
            className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
              isActive(item.url)
                ? "bg-sidebar-accent border-border text-foreground shadow-sm hover"
                : "hover:text-accent-foreground"
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
