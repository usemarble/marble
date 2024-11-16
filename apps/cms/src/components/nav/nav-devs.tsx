"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

import { BookOpen, Frame, PieChart } from "lucide-react";
import Link from "next/link";

const items = [
  {
    name: "API Keys",
    url: "#",
    icon: Frame,
  },
  {
    name: "Analytics",
    url: "#",
    icon: PieChart,
  },
  {
    name: "Documentation",
    url: "#",
    icon: BookOpen,
  },
];

export function NavDevs() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Developers</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
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
