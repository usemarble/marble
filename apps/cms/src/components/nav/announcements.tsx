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
      <DropdownMenuTrigger render={<Button className="size-4" size="icon" variant="ghost" />}>
        <BellRinging />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="grid min-h-28 place-content-center">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">No announcements yet</p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
