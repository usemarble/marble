"use client";

import { Collapsible } from "@repo/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@repo/ui/components/sidebar";

import { Globe, Settings2, Users2 } from "lucide-react";
import Link from "next/link";

const items = [
  {
    name: "Teams",
    url: "./team",
    icon: Users2,
  },
  {
    name: "Sites",
    url: "./sites",
    icon: Globe,
  },
  {
    name: "Settings",
    url: "./settings",
    icon: Settings2,
  },
];

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
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
              <Link href={item.url}>
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
