import { SidebarInset, SidebarProvider } from "@marble/ui/components/sidebar";
import { cookies } from "next/headers";
import { AppSidebar } from "@/components/nav/app-sidebar";
import {
  SIDEBAR_STATE_COOKIE,
  WHATS_NEW_CARD_DISMISSED_COOKIE,
} from "@/components/nav/cookies";

export const metadata = {
  title: {
    template: "%s | Marble",
    default: "Marble",
  },
  description: "Manage your workspace",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isWhatsNewDismissed =
    cookieStore.get(WHATS_NEW_CARD_DISMISSED_COOKIE)?.value === "true";
  const defaultSidebarOpen =
    cookieStore.get(SIDEBAR_STATE_COOKIE)?.value !== "false";

  return (
    <SidebarProvider
      className="overflow-y-hidden"
      defaultOpen={defaultSidebarOpen}
      style={
        {
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar isWhatsNewDismissed={isWhatsNewDismissed} />
      <SidebarInset className="relative overflow-y-auto peer-data-[variant=inset]:border-l md:peer-data-[variant=inset]:shadow-none">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
