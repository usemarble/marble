"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@marble/ui/components/sidebar";

import { Key, WebhooksLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const items = [
  {
    name: "API Keys",
    url: "keys",
    icon: Key,
  },
  {
    name: "Webhooks",
    url: "webhooks",
    icon: WebhooksLogo,
  },
];

export function NavDevs() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();

  const isActive = (url: string) => {
    return pathname === `/${params.workspace}/${url}`;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Developers</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
                isActive(item.url)
                  ? "border-border bg-sidebar-accent text-foreground shadow-sm"
                  : "hover:text-accent-foreground"
              }`}
            >
              <Link href={`/${params.workspace}/${item.url}`}>
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
