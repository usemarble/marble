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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

interface NavUserProps {
  user:
    | {
        name: string;
        id: string;
        image?: string | null | undefined;
        email: string;
      }
    | undefined;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  if (!user) {
    return <Skeleton className="border rounded-md size-8 shrink-0" />;
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
        className="w-[--radix-dropdown-menu-trigger-width] rounded-lg min-w-52 text-sidebar-foreground"
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
          {/* <DropdownMenuItem>
            <Link
              href="/settings/billing"
              className="flex w-full items-center gap-4"
            >
              <CreditCard className="size-4" />
              Billing
            </Link>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
            }}
            className="flex w-full items-center gap-4"
          >
            <SignOut className="size-4" />
            Log out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
