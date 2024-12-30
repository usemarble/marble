"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

import Link from "next/link";
import { WebhookIcon } from "../icons/animated/webhook";
import { BookTextIcon } from "../icons/animated/book-text";
import { ConnectIcon } from "../icons/animated/connect";

const items = [
  {
    name: "API Keys",
    url: "/account/keys",
    icon: ConnectIcon,
  },
  {
    name: "Webhooks",
    url: "/webhooks",
    icon: WebhookIcon,
  },
  {
    name: "Documentation",
    url: "/docs",
    icon: BookTextIcon,
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
