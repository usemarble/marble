import getServerSession from "@/lib/auth/session";
import db from "@marble/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const session = await getServerSession();

  const workspaceData = await db.organization.findUnique({
    where: { slug: workspace },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          members: true,
        },
      },
      members: {
        where: {
          userId: session?.user.id,
        },
      },
    },
  });

  // Check if workspace exists and user is a member
  if (!workspaceData || workspaceData.members.length === 0) {
    return notFound();
  }

  // Remove members from the data we pass to the client
  const { members, ...workspaceDataWithoutMembers } = workspaceData;
  return <PageClient workspace={workspaceDataWithoutMembers} />;
}

export default Page;
