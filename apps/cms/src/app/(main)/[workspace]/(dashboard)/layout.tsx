import { SidebarInset, SidebarProvider } from "@marble/ui/components/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";
import type { Workspace } from "@/types/workspace";
import { request } from "@/utils/fetch/client";

const _getWorkspaceData = async (workspace: string) => {
  const res = await request<Workspace | null>(`workspaces/${workspace}`);
  return res.data;
};

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
  return (
    <SidebarProvider
      className="overflow-y-hidden"
      style={
        {
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="relative overflow-y-auto peer-data-[variant=inset]:border-l md:peer-data-[variant=inset]:shadow-none">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
