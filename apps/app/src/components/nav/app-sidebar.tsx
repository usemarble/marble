import getSession from "@/lib/auth/get-session";
import prisma from "@repo/db";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/components/sidebar";
import GreetingCard from "../walkthrough/greeting-card";
import { NavDevs } from "./nav-devs";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SiteSwitcher } from "./site-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();
  const user = session?.user;

  const userSites = await prisma.site.findMany({
    where: { ownerId: user?.id },
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SiteSwitcher sites={userSites} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavDevs />
      </SidebarContent>
      <SidebarFooter>
        <GreetingCard />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
