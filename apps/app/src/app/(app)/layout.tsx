import getSession from "@/lib/auth/get-session";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { Separator } from "@repo/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar";
import prisma from "@repo/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;
  if (!session) return redirect("/login");

  const userSites = await prisma.site.findMany({
    where: { ownerId: user?.id },
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 size-4" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-48px)] flex-1 flex-col gap-4 px-4 py-2">
          {children}
          <div className="fixed bottom-8 right-8" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
