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
import { Check, Plus } from "@marble/ui/lib/icons";
import { cn } from "@marble/ui/lib/utils";
import { CaretDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "../../providers/workspace";
import { UpgradeModal } from "../billing/upgrade-modal";
import { CreateWorkspaceModal } from "./workspace-modal";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] =
    useState(false);
  const {
    activeWorkspace,
    updateActiveWorkspace,
    workspaceList,
    isFetchingWorkspace,
  } = useWorkspace();

  const ownedWorkspaces =
    workspaceList?.filter((workspace) => workspace.userRole === "owner") || [];

  const sharedWorkspaces =
    workspaceList?.filter((workspace) => workspace.userRole !== "owner") || [];

  async function switchWorkspace(org: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  }) {
    if (org.slug === activeWorkspace?.slug) return;

    try {
      await updateActiveWorkspace(org.slug, org);
      router.push(`/${org.slug}`);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  }

  const handleAddWorkspace = () => {
    setShowCreateWorkspaceModal(true);
  };

  // Show skeleton only if we're loading and don't have activeWorkspace data
  const showSkeleton = !activeWorkspace && isFetchingWorkspace;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {activeWorkspace && !showSkeleton ? (
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent border border-transparent hover:border-border hover:shadow-sm transition"
                disabled={isFetchingWorkspace}
              >
                <Avatar className="size-8 rounded-">
                  <AvatarImage
                    src={activeWorkspace.logo || undefined}
                    className="rounded-[4px]"
                  />
                  <AvatarFallback className="border bg-sidebar-accent">
                    {activeWorkspace.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 gap-2 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-sm text-ellipsis">
                    {activeWorkspace?.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-center py-0 px-1.5 text-[11px] justify-center bg-gray-50 text-gray-500 border-gray-300",
                      {
                        "bg-emerald-50 dark:bg-transparent text-emerald-500 border-emerald-300":
                          activeWorkspace.subscription?.plan === "pro",

                        "bg-blue-50 dark:bg-transparent text-blue-500 border-blue-300":
                          activeWorkspace.subscription?.plan === "team",
                      },
                    )}
                  >
                    {activeWorkspace.subscription?.plan || "free"}
                  </Badge>
                </div>
                <CaretDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          ) : (
            <div className="bg-sidebar-accent rounded-md border p-2 flex items-center gap-2">
              <Skeleton className="border rounded-md size-8 shrink-0" />
              <div className="flex flex-col gap-1 w-full">
                <Skeleton className="h-3 border w-3/4" />
                <Skeleton className="border h-3 w-1/2" />
              </div>
              <Skeleton className="border rounded-md size-4 ml-auto" />
            </div>
          )}
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
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
                      type="button"
                      onClick={() => switchWorkspace(org)}
                      disabled={isFetchingWorkspace}
                      className="relative flex w-full items-center gap-4 disabled:opacity-50"
                    >
                      <Avatar className="size-6 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {org.name}
                      {activeWorkspace?.id === org.id && (
                        <Check className="text-muted-foreground absolute right-0 size-4" />
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
                      type="button"
                      onClick={() => switchWorkspace(org)}
                      disabled={isFetchingWorkspace}
                      className="relative flex w-full items-center gap-4 disabled:opacity-50"
                    >
                      <Avatar className="size-6 rounded-[0.2rem]">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {org.name}
                      {activeWorkspace?.id === org.id && (
                        <Check className="text-muted-foreground absolute right-0 size-4" />
                      )}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <button
                type="button"
                onClick={handleAddWorkspace}
                className="flex w-full items-center gap-2"
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add workspace
                </div>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateWorkspaceModal
        open={showCreateWorkspaceModal}
        setOpen={setShowCreateWorkspaceModal}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </SidebarMenu>
  );
}
