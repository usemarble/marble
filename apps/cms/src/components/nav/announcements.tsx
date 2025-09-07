"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { BellRinging } from "@phosphor-icons/react";

export function Announcements() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="size-4">
          <BellRinging />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="min-h-28 grid place-content-center">
          <div className="text-muted-foreground flex flex-col gap-3 justify-center items-center">
            <p className="text-sm">No announcements yet</p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
