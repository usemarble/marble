"use client";

import { useSidebar } from "@marble/ui/components/sidebar";
import { NavExtra } from "./nav-extra";
import { NavUser } from "./nav-user";

export function SidebarFooterContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <div className="flex justify-center p-1">
        <NavUser />
      </div>
    );
  }

  return (
    <section className="flex items-center gap-2 justify-between p-2">
      <NavUser />
      <NavExtra />
    </section>
  );
}
