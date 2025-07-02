import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@marble/ui/components/sidebar";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { NavDevs } from "./nav-devs";
import { NavExtra } from "./nav-extra";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { WorkspaceSwitcher } from "./workspace-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain />
        <NavDevs />
      </SidebarContent>
      <SidebarFooter className="p-2">
        <section className="flex items-center gap-2 justify-between p-2">
          <NavUser user={session?.user} />
          <NavExtra />
        </section>
      </SidebarFooter>
    </Sidebar>
  );
}
