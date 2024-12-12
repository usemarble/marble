"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

import { BookOpen, Frame, PieChart, Webhook } from "lucide-react";
import Link from "next/link";

const items = [
  {
    name: "API Keys",
    url: "/account/keys",
    icon: Frame,
  },
  {
    name: "Analytics",
    url: "/analytics",
    icon: PieChart,
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
            <SidebarMenuButton asChild>
              <Link href={item.url} className="hover:bg-muted">
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
