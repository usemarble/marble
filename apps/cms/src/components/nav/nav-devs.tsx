"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookTextIcon } from "../icons/animated/book-text";
import { ConnectIcon } from "../icons/animated/connect";
import { WebhookIcon } from "../icons/animated/webhook";

const items = [
  {
    name: "API Keys",
    url: "keys",
    icon: ConnectIcon,
  },
  {
    name: "Webhooks",
    url: "webhooks",
    icon: WebhookIcon,
  },
];

interface NavDevsProps {
  workspaceSlug: string | undefined;
}

export function NavDevs({ workspaceSlug }: NavDevsProps) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === `/${workspaceSlug}/${url}`;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Developers</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className={`border border-transparent ${
                isActive(item.url)
                  ? "bg-background border-border hover:bg-background"
                  : "hover:bg-background hover:border-border"
              }`}
            >
              <Link href={`/${workspaceSlug}/${item.url}`}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuButton
          asChild
          className="border border-transparent hover:bg-background hover:border-border"
        >
          <Link target="_blank" href="https://marblecms-web.vercel.app">
            <BookTextIcon />
            <span>Documentation</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenu>
    </SidebarGroup>
  );
}
