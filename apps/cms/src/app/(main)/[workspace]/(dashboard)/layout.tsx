import { SidebarInset, SidebarProvider } from "@marble/ui/components/sidebar";
import { cookies } from "next/headers";
import { AppSidebar } from "@/components/nav/app-sidebar";

const CUSTOM_FIELDS_UPDATE_CARD_DISMISSED = "custom_fields_update_card_dismissed";

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
    cookieStore.get(CUSTOM_FIELDS_UPDATE_CARD_DISMISSED)?.value === "true";

  return (
    <SidebarProvider
      className="overflow-y-hidden"
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
