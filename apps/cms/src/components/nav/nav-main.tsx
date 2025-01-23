"use client";

import { Collapsible } from "@repo/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@repo/ui/components/sidebar";

import { useActiveOrganization } from "@/lib/auth/client";
import { Group, ImageIcon, Tags } from "@repo/ui/lib/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayersIcon } from "../icons/animated/layers";
import { LayoutPanelTopIcon } from "../icons/animated/layout-panel-top";
import { SettingsIcon } from "../icons/animated/settings";
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
    icon: SettingsIcon,
  },
];

export function NavMain() {
  const { data: workspace } = useActiveOrganization();
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === `/${workspace?.slug}/${url}`;
  };

  const isOverviewActive = pathname === `/${workspace?.slug}`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible asChild defaultOpen={false} className="group/collapsible">
          <SidebarMenuButton
            asChild
            className={`border border-transparent ${
              isOverviewActive
                ? "bg-background border-border hover:bg-background"
                : "hover:bg-background hover:border-border"
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
                isActive(item.url)
                  ? "bg-background border-border hover:bg-background"
                  : "hover:bg-background hover:border-border"
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
