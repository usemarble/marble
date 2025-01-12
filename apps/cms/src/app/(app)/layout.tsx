import AppBreadcrumb from "@/components/nav/app-breadcrumb";
import { AppSidebar } from "@/components/nav/app-sidebar";
import getServerSession from "@/lib/auth/session";
import { Separator } from "@repo/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // BAD!!! layouts dont re render move to middleware later
  // const session = await getServerSession();
  // if (!session) return redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 md:px-8 sticky top-0 bg-background border-b">
          <div className="flex md:hidden items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 size-4" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div>
            <AppBreadcrumb />
          </div>
        </header>
        <main className="flex min-h-screen flex-1 flex-col gap-4 px-4 py-2">
          {children}
          <div className="fixed bottom-8 right-8" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
