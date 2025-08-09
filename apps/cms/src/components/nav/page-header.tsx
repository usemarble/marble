"use client";

import { Separator } from "@marble/ui/components/separator";
import { SidebarTrigger } from "@marble/ui/components/sidebar";
import { usePathname } from "next/navigation";
// import { Announcements } from "./announcements";

export const PageHeader = () => {
  const pathname = usePathname();

  let heading = "Home";
  if (pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1 && parts[1]) {
      heading = parts[1];
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-dashed bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 md:px-8">
      <div className="flex items-center gap-2 px-4 md:hidden">
        <SidebarTrigger className="-ml-1 size-4" />
        <Separator className="mr-2 h-4" orientation="vertical" />
      </div>
      {/* <div>
          <AppBreadcrumb />
        </div> */}
      <h1 className="font-medium text-2xl capitalize">{heading}</h1>
      {/* <div className="ml-auto flex items-center">
          <Announcements />
        </div> */}
    </header>
  );
};
