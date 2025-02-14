import { Announcements } from "@/components/nav/announcements";
import AppBreadcrumb from "@/components/nav/app-breadcrumb";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { Separator } from "@marble/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@marble/ui/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex z-10 h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 md:px-8 sticky top-0 bg-background border-b">
          <div className="flex md:hidden items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 size-4" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div>
            <AppBreadcrumb />
          </div>
          <div className="ml-auto flex items-center">
            <Announcements />
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-56px)] flex-1 flex-col gap-4 px-4 py-2">
          {children}
          <div className="fixed bottom-8 right-8" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
