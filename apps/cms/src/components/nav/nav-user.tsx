"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "@repo/ui/lib/icons";

import { authClient } from "@/lib/auth/client";
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
import { useRouter } from "next/navigation";

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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-background border-transparent hover:border-border border"
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
                <span className="truncate font-medium">{user?.name}</span>
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
                  Upgrade Plan
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
