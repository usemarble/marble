"use client";

import { Check, ChevronsUpDown, Plus } from "@marble/ui/lib/icons";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
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

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from "@/lib/auth/client";
import type {
  ActiveOrganization,
  Organization,
  Session,
} from "@/lib/auth/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Skeleton } from "@marble/ui/components/skeleton";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../context/workspace";
import { CreateWorkspaceModal } from "./workspace-modal";

interface WorkspaceSwitcherProps {
  session: Session | null;
}

export function WorkspaceSwitcher({ session }: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const organizations = useListOrganizations();
  const { activeWorkspace, updateActiveWorkspace } = useWorkspace();

  async function switchWorkspace(org: Organization) {
    if (org.slug === activeWorkspace?.slug) return;

    await updateActiveWorkspace(org.slug, org);
    router.push(`/${org.slug}`, { scroll: false });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {activeWorkspace ? (
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-background border border-transparent hover:border-border"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square">
                  <Avatar className="size-8 rounded-none">
                    <AvatarImage
                      src={activeWorkspace.logo ?? ""}
                      className="rounded-[4px]"
                    />
                    <AvatarFallback>HA</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-sm">
                    {activeWorkspace?.name || "Personal"}
                  </span>
                  <span className="truncate text-xs text-primary">
                    Free
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          ) : (
            <div className="bg-white rounded-md border p-2 flex items-center gap-2">
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
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {organizations.data?.map((org: Organization) => (
              <DropdownMenuItem key={org.id}>
                <button
                  type="button"
                  onClick={() => switchWorkspace(org)}
                  className="relative flex w-full items-center gap-4"
                >
                  <Avatar className="size-6 rounded-[0.2rem]">
                    <AvatarImage src={org.logo ?? ""} />
                    <AvatarFallback>XX</AvatarFallback>
                  </Avatar>
                  {org.name}
                  {activeWorkspace?.id === org.id && (
                    <Check className="text-muted-foreground absolute right-0 size-4" />
                  )}
                </button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <button
                type="button"
                onClick={() => setOpen(true)}
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
      <CreateWorkspaceModal open={open} setOpen={setOpen} />
    </SidebarMenu>
  );
}
