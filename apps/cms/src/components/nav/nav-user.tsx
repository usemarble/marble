"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { useSidebar } from "@marble/ui/components/sidebar";
import { Skeleton } from "@marble/ui/components/skeleton";
import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useUser } from "@/providers/user";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, signOut, isFetchingUser } = useUser();

  if (!user || isFetchingUser) {
    return <Skeleton className="size-8 shrink-0 rounded-full border" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full p-1 transition-colors hover:bg-sidebar-accent">
        <Avatar className="size-7 cursor-pointer rounded-full">
          <AvatarImage
            alt={user?.name || "users profile image"}
            src={user?.image || undefined}
          />
          <AvatarFallback className="rounded-lg">
            {user?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[var(--anchor-width)] rounded-lg text-sidebar-foreground"
        side={isMobile ? "bottom" : "top"}
        sideOffset={5}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-7">
                <AvatarImage
                  alt={user?.name || "users profile image"}
                  src={user?.image || undefined}
                />
                <AvatarFallback className="rounded-lg">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-sm">
                  {user?.name}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {user?.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link
              className="flex w-full items-center gap-4"
              href="/settings/account"
            >
              <UserIcon className="size-4" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem onSelect={signOut} variant="destructive">
          <SignOutIcon className="mr-1.5 size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
