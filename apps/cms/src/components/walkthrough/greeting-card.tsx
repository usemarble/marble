import { SidebarGroup } from "@repo/ui/components/sidebar";
import React from "react";

function GreetingCard() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="border-2 rounded-xl p-3 flex flex-col gap-4">
        <p className="text-primary font-medium text-sm">Welcome back!</p>
        <div>
          <p className="text-xs text-muted-foreground">
            What will you write today?
          </p>
        </div>
      </div>
    </SidebarGroup>
  );
}

export default GreetingCard;
