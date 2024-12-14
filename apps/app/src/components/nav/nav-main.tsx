"use client";

import { Collapsible } from "@repo/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@repo/ui/components/sidebar";

import { Globe, Settings2, Users2 } from "@repo/ui/lib/icons";
import Link from "next/link";

const items = [
  {
    name: "Teams",
    url: "/teams",
    icon: Users2,
  },
  {
    name: "Sites",
    url: "/sites",
    icon: Globe,
  },
  {
    name: "Settings",
    url: "/settings",
    icon: Settings2,
  },
];

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.name}
            asChild
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarMenuButton asChild>
              <Link href={item.url} className="hover:bg-muted">
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
