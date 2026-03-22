"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import { buttonVariants } from "@marble/ui/components/button";
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
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { getWorkspacePlan } from "@/lib/plans";
import type { Workspace } from "@/types/workspace";
import { useWorkspace } from "../../providers/workspace";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceSwitcher() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const {
    activeWorkspace,
    updateActiveWorkspace,
    workspaceList,
    isFetchingWorkspace,
  } = useWorkspace();

  const [dialogOpen, setDialogOpen] = useState(false);

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
  const currentPlan = getWorkspacePlan(activeWorkspace?.subscription);
  const dropdownItemClass = cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "relative w-full justify-start gap-2 rounded-md font-normal text-[13px]"
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {activeWorkspace && !showSkeleton ? (
            <DropdownMenuTrigger
              nativeButton={false}
              render={
                <SidebarMenuButton
                  className={cn(
                    "h-9 w-fit cursor-pointer border border-transparent px-2 py-1.5 transition hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                    isCollapsed && "min-w-0 justify-center rounded-full p-1"
                  )}
                  disabled={isFetchingWorkspace}
                  render={<div />}
                >
                  <Avatar className={cn("size-6.5", isCollapsed && "size-6")}>
                    <AvatarImage
                      className="rounded-[4px]"
                      src={activeWorkspace.logo || undefined}
                    />
                    <AvatarFallback className="border bg-sidebar-accent text-xs">
                      {activeWorkspace.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-1 gap-2 text-left text-sm leading-tight">
                        <span className="truncate text-ellipsis font-medium text-sm">
                          {activeWorkspace?.name}
                        </span>
                        <Badge
                          className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
                          variant={currentPlan === "pro" ? "paid" : "free"}
                        >
                          {currentPlan === "hobby" ? "free" : currentPlan}
                        </Badge>
                      </div>
                      <HugeiconsIcon
                        className="size-3 shrink-0"
                        icon={ArrowDown01Icon}
                      />
                    </>
                  )}
                </SidebarMenuButton>
              }
            />
          ) : (
            <div
              className={cn(
                "flex items-center rounded-md border bg-sidebar-accent",
                isCollapsed ? "size-10 justify-center p-1" : "gap-2 p-2"
              )}
            >
              <Skeleton
                className={cn(
                  "shrink-0 rounded-md border",
                  isCollapsed ? "size-6" : "size-8"
                )}
              />
              {!isCollapsed && (
                <>
                  <div className="flex w-full flex-col gap-1">
                    <Skeleton className="h-3 w-3/4 border" />
                    <Skeleton className="h-3 w-1/2 border" />
                  </div>
                  <Skeleton className="ml-auto size-4 rounded-md border" />
                </>
              )}
            </div>
          )}
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {ownedWorkspaces.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Your Workspaces
                </DropdownMenuLabel>
                {ownedWorkspaces.map((org) => (
                  <DropdownMenuItem className="p-0 focus:bg-transparent" key={org.id}>
                    <button
                      className={cn(dropdownItemClass, "pr-8")}
                      disabled={isFetchingWorkspace}
                      onClick={() => switchWorkspace(org)}
                      type="button"
                    >
                      <Avatar className="size-5 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {org.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[13px]">{org.name}</span>
                      {activeWorkspace?.id === org.id && (
                        <CheckIcon className="absolute right-2 size-4 text-muted-foreground" />
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
                  <DropdownMenuItem className="p-0 focus:bg-transparent" key={org.id}>
                    <button
                      className={cn(dropdownItemClass, "pr-8")}
                      disabled={isFetchingWorkspace}
                      onClick={() => switchWorkspace(org)}
                      type="button"
                    >
                      <Avatar className="size-5 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {org.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[13px]">{org.name}</span>
                      {activeWorkspace?.id === org.id && (
                        <CheckIcon className="absolute right-2 size-4 text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0 focus:bg-transparent">
              <button
                className={dropdownItemClass}
                onClick={() => setDialogOpen(true)}
                type="button"
              >
                <div className="flex size-5 items-center justify-center rounded-md border bg-background">
                  <PlusIcon className="size-3.5" />
                </div>
                <div className="font-medium text-[13px]">Create Workspace</div>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateWorkspaceDialog open={dialogOpen} setOpen={setDialogOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
