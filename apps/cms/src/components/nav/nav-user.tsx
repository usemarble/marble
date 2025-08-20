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
    return <Skeleton className="border rounded-full size-8 shrink-0" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 hover:bg-sidebar-accent rounded-full transition-colors">
        <Avatar className="size-7 rounded-full cursor-pointer">
          <AvatarImage
            src={user?.image || undefined}
            alt={user?.name || "users profile image"}
          />
          <AvatarFallback className="rounded-lg">
            {user?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "top"}
        align="start"
        sideOffset={5}
        className="w-(--radix-dropdown-menu-trigger-width) rounded-lg min-w-52 text-sidebar-foreground"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-7">
              <AvatarImage
                src={user?.image || undefined}
                alt={user?.name || "users profile image"}
              />
              <AvatarFallback className="rounded-lg">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate text-sm font-medium">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link
              href="/settings/account"
              className="flex w-full items-center gap-4"
            >
              <User className="size-4" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="flex w-full items-center gap-4"
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
