import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@marble/ui/components/sidebar";
import { NavDevs } from "./nav-devs";
import { NavExtra } from "./nav-extra";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { WorkspaceSwitcher } from "./workspace-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain />
        <NavDevs />
      </SidebarContent>
      <SidebarFooter className="p-2">
        <section className="flex items-center gap-2 justify-between p-2">
          <NavUser />
          <NavExtra />
        </section>
      </SidebarFooter>
    </Sidebar>
  );
}
