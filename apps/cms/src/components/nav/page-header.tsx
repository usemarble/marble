"use client";

import { Separator } from "@marble/ui/components/separator";
import { SidebarTrigger } from "@marble/ui/components/sidebar";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace";

export const PageHeader = () => {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  const getHeading = () => {
    const parts = pathname.split("/").filter(Boolean);

    // workspace routes: /[workspace]/
    if (parts.length >= 2) {
      const [, section, subsection] = parts;

      // Handle settings pages
      if (typeof section === "string" && section === "settings") {
        if (!subsection) {
          return "General";
        }

        // Map subsection to proper display names
        const subsectionMap: Record<string, string> = {
          general: "General",
          members: "Members",
          billing: "Billing",
          schemas: "Schemas",
        };

        return subsectionMap[subsection] || subsection;
      }

      // For other sections like posts, just show the section name
      if (typeof section === "string" && section.length > 0) {
        return section.charAt(0).toUpperCase() + section.slice(1);
      }
    }

    return activeWorkspace?.name ?? "Home";
  };

  return (
    <header className="flex sticky top-0 z-50 h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10 md:px-8 bg-background border-b border-dashed">
      <div className="flex md:hidden items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 size-4" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      {/* <div>
        <AppBreadcrumb />
      </div> */}
      <h1 className="text-lg font-medium capitalize">{getHeading()}</h1>
    </header>
  );
};
