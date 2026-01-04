"use client";

import { Key01Icon, WebhookIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const items = [
  {
    name: "API Keys",
    url: "keys",
    icon: Key01Icon,
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
  const { open } = useSidebar();
  const isActive = (url: string) => pathname === `/${params.workspace}/${url}`;

  return (
    <SidebarGroup className={cn(open ? "px-4" : "px-2")}>
      <SidebarGroupLabel>Developers</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              className={`border border-transparent transition-colors duration-200 hover:bg-sidebar-accent ${
                isActive(item.url)
                  ? "border bg-sidebar-accent text-foreground"
                  : "hover:text-accent-foreground"
              }`}
              render={
                <Link href={`/${params.workspace}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} /> <span>{item.name}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
