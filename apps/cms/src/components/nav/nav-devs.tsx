"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@marble/ui/components/sidebar";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
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
              className={`border border-transparent ${
                isActive(item.url)
                  ? "bg-background border-border hover:bg-background hover:text-primary text-primary"
                  : "hover:bg-background hover:border-border"
              }`}
            >
              <Link href={`/${params.workspace}/${item.url}`}>
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
          <Link target="_blank" href="https://docs.marblecms.com">
            <BookTextIcon />
            <span>Docs</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenu>
    </SidebarGroup>
  );
}
