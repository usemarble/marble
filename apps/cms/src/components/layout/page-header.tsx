"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HeaderSidebarTrigger } from "@/components/layout/header-sidebar-trigger";

export const PageHeader = ({ title }: { title?: ReactNode }) => {
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
          editor: "Editor",
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
    <header className="sticky top-0 z-50 flex h-13 shrink-0 items-center gap-2 border-b border-dashed bg-background transition-[width,height] ease-linear md:px-4">
      <HeaderSidebarTrigger />
      {/* <div>
        <AppBreadcrumb />
      </div> */}
      <h1 className="font-medium text-lg capitalize">
        {title ?? getHeading()}
      </h1>
    </header>
  );
};
