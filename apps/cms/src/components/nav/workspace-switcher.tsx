"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { Skeleton } from "@marble/ui/components/skeleton";
import { cn } from "@marble/ui/lib/utils";
import { CaretDown, Check, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import type { Workspace } from "@/types/workspace";
import { useWorkspace } from "../../providers/workspace";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const {
    activeWorkspace,
    updateActiveWorkspace,
    workspaceList,
    isFetchingWorkspace,
  } = useWorkspace();

  const ownedWorkspaces =
    workspaceList?.filter(
      (workspace) => workspace.currentUserRole === "owner"
    ) || [];

  const sharedWorkspaces =
    workspaceList?.filter(
      (workspace) => workspace.currentUserRole !== "owner"
    ) || [];

  async function switchWorkspace(org: Workspace) {
    if (org.slug === activeWorkspace?.slug) {
      return;
    }

    try {
      await updateActiveWorkspace(org);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  }

  const showSkeleton = !activeWorkspace && isFetchingWorkspace;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {activeWorkspace && !showSkeleton ? (
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="border border-transparent transition hover:border-border hover:bg-sidebar-accent hover:shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                disabled={isFetchingWorkspace}
                size="lg"
              >
                <Avatar className="rounded- size-8">
                  <AvatarImage
                    className="rounded-[4px]"
                    src={activeWorkspace.logo || undefined}
                  />
                  <AvatarFallback className="border bg-sidebar-accent">
                    {activeWorkspace.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 gap-2 text-left text-sm leading-tight">
                  <span className="truncate text-ellipsis font-medium text-sm">
                    {activeWorkspace?.name}
                  </span>
                  <Badge
                    className={cn(
                      "justify-center border-gray-300 bg-gray-50 px-1.5 py-0 text-center text-[11px] text-gray-500 capitalize",
                      {
                        "border-blue-300 bg-emerald-50 text-blue-500 dark:bg-transparent":
                          activeWorkspace.subscription?.plan === "pro",
                      }
                    )}
                    variant="outline"
                  >
                    {activeWorkspace.subscription?.plan || "free"}
                  </Badge>
                </div>
                <CaretDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          ) : (
            <div className="flex items-center gap-2 rounded-md border bg-sidebar-accent p-2">
              <Skeleton className="size-8 shrink-0 rounded-md border" />
              <div className="flex w-full flex-col gap-1">
                <Skeleton className="h-3 w-3/4 border" />
                <Skeleton className="h-3 w-1/2 border" />
              </div>
              <Skeleton className="ml-auto size-4 rounded-md border" />
            </div>
          )}
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {ownedWorkspaces.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Your workspaces
                </DropdownMenuLabel>
                {ownedWorkspaces.map((org) => (
                  <DropdownMenuItem key={org.id}>
                    <button
                      className="relative flex w-full items-center gap-4 disabled:opacity-50"
                      disabled={isFetchingWorkspace}
                      onClick={() => switchWorkspace(org)}
                      type="button"
                    >
                      <Avatar className="size-6 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {org.name}
                      {activeWorkspace?.id === org.id && (
                        <Check className="absolute right-0 size-4 text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}

            {sharedWorkspaces.length > 0 && (
              <DropdownMenuGroup>
                {ownedWorkspaces.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Shared workspaces
                </DropdownMenuLabel>
                {sharedWorkspaces.map((org) => (
                  <DropdownMenuItem key={org.id}>
                    <button
                      className="relative flex w-full items-center gap-4 disabled:opacity-50"
                      disabled={isFetchingWorkspace}
                      onClick={() => switchWorkspace(org)}
                      type="button"
                    >
                      <Avatar className="size-6 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {org.name}
                      {activeWorkspace?.id === org.id && (
                        <Check className="absolute right-0 size-4 text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link className="flex w-full items-center gap-2" href="/new">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add workspace
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
