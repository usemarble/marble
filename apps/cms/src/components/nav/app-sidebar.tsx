import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@marble/ui/components/sidebar";
import { NavDevs } from "./nav-devs";
import { NavMain } from "./nav-main";
import { NavSeo } from "./nav-seo";
import { SidebarFooterContent } from "./sidebar-footer-content";
import { UpgradeButton } from "./upgrade-button";
import { WorkspaceSwitcher } from "./workspace-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="border-none">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSeo />
        <NavDevs />
      </SidebarContent>
      <SidebarFooter>
        <UpgradeButton />
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}
