"use client";

import { Collapsible } from "@repo/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@repo/ui/components/sidebar";

import { Globe, Layers, Tags } from "@repo/ui/lib/icons";
import Link from "next/link";
import { useWorkspace } from "../providers/workspace";
import { UsersIcon } from "../icons/animated/users";
import { LayoutPanelTopIcon } from "../icons/animated/layout-panel-top";
import { SettingsIcon } from "../icons/animated/settings";
import { usePathname } from "next/navigation";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: Layers,
  },
  {
    name: "Tags",
    url: "tags",
    icon: Tags,
  },
  {
    name: "Team",
    url: "team",
    icon: UsersIcon,
  },
  {
    name: "Settings",
    url: "settings",
    icon: SettingsIcon,
  },
];

export function NavMain() {
  const { workspace } = useWorkspace();
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === `/${workspace?.slug}/${url}`;
  };

  const isOverviewActive = pathname === `/${workspace?.slug}`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible
          asChild
          defaultOpen={false}
          className="group/collapsible"
        >
          <SidebarMenuButton
            asChild
            className={`border border-transparent ${
              isOverviewActive ? "bg-muted border-border" : "hover:bg-muted hover:border-border"
            }`}
          >
            <Link href={`/${workspace?.slug}`}>
              <LayoutPanelTopIcon />
              <span>Overview</span>
            </Link>
          </SidebarMenuButton>
        </Collapsible>
        {items.map((item) => (
          <Collapsible
            key={item.name}
            asChild
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarMenuButton
              asChild
              className={`border border-transparent ${
                isActive(item.url) ? "bg-muted border-border" : "hover:bg-muted hover:border-border"
              }`}
            >
              <Link href={`/${workspace?.slug}/${item.url}`}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
