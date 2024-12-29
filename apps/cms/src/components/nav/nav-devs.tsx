"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

import { BookOpen, Key, Webhook } from "@repo/ui/lib/icons";
import Link from "next/link";

const items = [
  {
    name: "API Keys",
    url: "/account/keys",
    icon: Key,
  },
  {
    name: "Webhooks",
    url: "/webhooks",
    icon: Webhook,
  },
  {
    name: "Documentation",
    url: "/docs",
    icon: BookOpen,
  },
];

export function NavDevs() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Developers</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className="hover:bg-muted border border-transparent hover:border-border"
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
