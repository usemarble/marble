import { db } from "@marble/db";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth/session";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "New workspace",
};

const getUserWorkspaces = async () => {
  const session = await getServerSession();
  if (!session?.user) {
    return false;
  }
  const workspaces = await db.organization.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
  });

  return workspaces.length > 0;
};

async function Page() {
  const hasWorkspaces = await getUserWorkspaces();

  return <PageClient hasWorkspaces={hasWorkspaces} />;
}

export default Page;
