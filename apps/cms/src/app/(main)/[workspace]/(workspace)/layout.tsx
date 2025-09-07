import { SidebarInset, SidebarProvider } from "@marble/ui/components/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { PageHeader } from "@/components/nav/page-header";
import type { Workspace } from "@/types/workspace";
import { request } from "@/utils/fetch/client";

const _getWorkspaceData = async (workspace: string) => {
  const res = await request<Workspace | null>(`workspaces/${workspace}`);
  return res.data;
};

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ workspace: string }>;
// }): Promise<Metadata> {
//   const { workspace } = await params;
//   const data = await getWorkspaceData(workspace);
//   return {
//     title: {
//       template: `%s | ${data?.name} | Marble`,
//       default: data?.name ?? "",
//     },
//   };
// }

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
    <SidebarProvider className="overflow-y-hidden">
      <AppSidebar />
      <SidebarInset className="peer-data-[variant=inset]:border-l md:peer-data-[variant=inset]:shadow-none relative overflow-y-auto">
        <PageHeader />
        <section className="flex min-h-[calc(100vh-56px)] flex-1 flex-col gap-4 px-4 py-2 w-full">
          {children}
          <div className="fixed bottom-8 right-8" />
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
