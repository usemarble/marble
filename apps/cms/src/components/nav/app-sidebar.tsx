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
import { WorkspaceSwitcher } from "./workspace-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();
  const user = session?.user;

  const userWorkspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: user?.id }, // Workspaces owned by the user
        { members: { some: { userId: user?.id } } }, // Workspaces where the user is a member
      ],
    },
    include: {
      owner: { select: { subscription: { select: { plan: true } } } }, // Get the owner's subscription plan
    },
  });

  // Add the subscription plan to each workspace for display
  const workspacesWithPlan = userWorkspaces.map((workspace) => ({
    ...workspace,
    plan: workspace.owner?.subscription?.plan || "FREE", // Default to 'FREE' if no subscription exists
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={workspacesWithPlan} />
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
