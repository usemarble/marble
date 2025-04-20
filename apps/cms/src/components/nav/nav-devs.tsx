"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@marble/ui/components/sidebar";

import { Plugs, WebhooksLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BookTextIcon } from "../icons/animated/book-text";
import { ConnectIcon } from "../icons/animated/connect";
import { WebhookIcon } from "../icons/animated/webhook";

const items = [
  {
    name: "API Keys",
    url: "keys",
    icon: Plugs,
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
                  ? "bg-background border-border text-foreground shadow-sm"
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
