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
import { SignOut, User } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/providers/user";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isSigningOut, signOut, isFetchingUser } = useUser();

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
        className="w-[--radix-dropdown-menu-trigger-width] min-w-52 rounded-lg text-sidebar-foreground"
        side={isMobile ? "bottom" : "top"}
        sideOffset={5}
      >
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
              <span className="truncate font-medium text-sm">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link
              className="flex w-full items-center gap-4"
              href="/settings/account"
            >
              <User className="size-4" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            className="flex w-full items-center gap-4"
            disabled={isSigningOut}
            onClick={signOut}
            type="button"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <SignOut className="size-4" />
                Log out
              </>
            )}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
