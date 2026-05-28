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
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  useParams,
  useRouter,
  useSelectedLayoutSegments,
} from "next/navigation";
import { prefetchDashboardRoute } from "@/lib/dashboard-prefetch";
import { useWorkspace } from "@/providers/workspace";
import { workspacePath } from "@/utils/workspace/url";

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
  const segments = useSelectedLayoutSegments();
  const router = useRouter();
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const { open } = useSidebar();

  const activeSegment = segments.find((segment) => !segment.startsWith("("));
  const isActive = (url: string) => activeSegment === url;

  const isOverviewActive = !activeSegment;
  const prefetchRoute = (url = "") => {
    const href = workspacePath(params.workspace, url);
    router.prefetch(href);

    if (activeWorkspace?.id) {
      prefetchDashboardRoute(queryClient, activeWorkspace.id, url).catch(
        () => undefined
      );
    }
  };

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
            <Link
              href={workspacePath(params.workspace)}
              onFocus={() => prefetchRoute()}
              onMouseEnter={() => prefetchRoute()}
            >
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
              <Link
                href={workspacePath(params.workspace, item.url)}
                onFocus={() => prefetchRoute(item.url)}
                onMouseEnter={() => prefetchRoute(item.url)}
              >
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
