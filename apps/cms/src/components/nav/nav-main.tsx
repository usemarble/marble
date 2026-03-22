"use client";

import {
  Files01Icon,
  Home01Icon,
  Image02Icon,
  Package01Icon,
  Tag01Icon,
  Users,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const items = [
  {
    name: "Posts",
    url: "posts",
    icon: Files01Icon,
  },
  {
    name: "Categories",
    url: "categories",
    icon: Package01Icon,
  },
  {
    name: "Tags",
    url: "tags",
    icon: Tag01Icon,
  },
  {
    name: "Media",
    url: "media",
    icon: Image02Icon,
  },
  {
    name: "Authors",
    url: "authors",
    icon: Users,
  },
];

export function NavMain() {
  const pathname = usePathname();
  const params = useParams<{ workspace: string }>();
  const { open } = useSidebar();

  const isActive = (url: string) => pathname === `/${params.workspace}/${url}`;

  const isOverviewActive = pathname === `/${params.workspace}`;

  return (
    <SidebarGroup className="px-3">
      <SidebarGroupLabel className="sr-only">Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuButton
          className={cn(
            "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
            !open && "justify-center gap-0",
            isOverviewActive
              ? "bg-sidebar-accent text-foreground"
              : "hover:text-accent-foreground"
          )}
          render={
            <Link href={`/${params.workspace}`}>
              <HugeiconsIcon icon={Home01Icon} />
              {open && <span>Home</span>}
            </Link>
          }
          tooltip="Home"
        />
        {items.map((item) => (
          <SidebarMenuButton
            className={cn(
              "border border-transparent transition-colors duration-200 hover:bg-sidebar-accent",
              !open && "justify-center gap-0",
              isActive(item.url)
                ? "bg-sidebar-accent text-foreground"
                : "hover:text-accent-foreground"
            )}
            key={item.name}
            render={
              <Link href={`/${params.workspace}/${item.url}`}>
                <HugeiconsIcon icon={item.icon} />
                {open && <span>{item.name}</span>}
              </Link>
            }
            tooltip={item.name}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
