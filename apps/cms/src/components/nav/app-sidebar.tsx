import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/components/sidebar";
import { NavUser } from "./nav-user";
import { SiteSwitcher } from "./site-switcher";
import { NavMain } from "./nav-main";
import { NavDevs } from "./nav-devs";
import getSession from "@/lib/auth/get-session";
import prisma from "@repo/db";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: "https://avatar.vercel.sh/team1.svg",
      plan: "Free",
    },
    {
      name: "Acme Corp.",
      logo: "https://avatar.vercel.sh/team2.svg",
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: "https://avatar.vercel.sh/team3.svg",
      plan: "Enterprise",
    },
  ],
};

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();
  const user = session?.user;

  const userSites = await prisma.site.findMany({
    where: { ownerId: user?.id! },
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
