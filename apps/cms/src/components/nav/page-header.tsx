"use client";

import { Separator } from "@marble/ui/components/separator";
import { SidebarTrigger } from "@marble/ui/components/sidebar";
import { usePathname } from "next/navigation";

export const PageHeader = () => {
  const pathname = usePathname();

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
          "editor-preferences": "Editor Preferences",
        };

        return subsectionMap[subsection] || subsection;
      }

      // For other sections like posts, just show the section name
      if (typeof section === "string" && section.length > 0) {
        return section.charAt(0).toUpperCase() + section.slice(1);
      }
    }

    return "Home";
  };

  return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b border-dashed bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10 md:px-8">
      <div className="flex items-center gap-2 px-4 md:hidden">
        <SidebarTrigger className="-ml-1 size-4" />
        <Separator className="mr-2 h-4" orientation="vertical" />
      </div>
      {/* <div>
        <AppBreadcrumb />
      </div> */}
      <h1 className="font-medium text-lg capitalize">{getHeading()}</h1>
    </header>
  );
};
