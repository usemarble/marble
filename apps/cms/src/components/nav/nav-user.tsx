"use client";
import * as React from "react";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { User } from "next-auth";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

interface NavUserProps {
  user: User | undefined;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();

  if (!user) {
    return (
      <div>
        <Skeleton className="h-8 w-8" />
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-[0.3rem]">
                <AvatarImage
                  src={
                    user?.image || "https://avatar.vercel.sh/unknownuser.svg"
                  }
                  alt={user?.name || "users profile image"}
                />
                <AvatarFallback className="rounded-lg">X</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user?.image || "https://avatar.vercel.sh/unknownuser.svg"
                    }
                    alt={user?.name || "users profile image"}
                  />
                  <AvatarFallback className="rounded-lg">X</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-4"
                >
                  <Sparkles className="text-muted-foreground size-4" />
                  Upgrade to Pro
                </button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-4"
                >
                  <BadgeCheck className="text-muted-foreground size-4" />
                  Account
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-4"
                >
                  <CreditCard className="text-muted-foreground size-4" />
                  Billing
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-4"
                >
                  <Bell className="text-muted-foreground size-4" />
                  Notifications
                </button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-4"
              >
                <LogOut className="text-muted-foreground size-4" />
                Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
