import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { SidebarGroup } from "@repo/ui/components/sidebar";
import React from "react";

function GreetingCard() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="border-2 rounded-xl p-3">
        <p className="text-primary font-medium">Hello friend</p>
        <p className="text-sm text-muted-foreground">How are you today?</p>
      </div>
    </SidebarGroup>
  );
}

export default GreetingCard;
