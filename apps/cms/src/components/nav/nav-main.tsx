"use client";

import { Collapsible } from "@repo/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@repo/ui/components/sidebar";

import { Globe } from "@repo/ui/lib/icons";
import Link from "next/link";
import { useWorkspace } from "../providers/workspace";
import { UsersIcon } from "../icons/animated/users";
import { LayoutPanelTopIcon } from "../icons/animated/layout-panel-top";
import { SettingsIcon } from "../icons/animated/settings";

const items = [
  {
    name: "Sites",
    url: "sites",
    icon: Globe,
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
            className="hover:bg-muted border border-transparent hover:border-border"
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
              className="hover:bg-muted border border-transparent hover:border-border"
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
