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
    <header className="flex sticky top-0 z-50 h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 md:px-8 bg-background border-b border-dashed">
      <div className="flex md:hidden items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 size-4" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      {/* <div>
          <AppBreadcrumb />
        </div> */}
      <h1 className="text-lg font-medium capitalize">{heading}</h1>
      {/* <div className="ml-auto flex items-center">
          <Announcements />
        </div> */}
    </header>
  );
};
