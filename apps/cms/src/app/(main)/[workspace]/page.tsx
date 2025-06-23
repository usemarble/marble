import db from "@marble/db";
import { notFound, redirect } from "next/navigation";
import getServerSession from "@/lib/auth/session";
import PageClient from "./page-client";

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const session = await getServerSession();

  // const workspaceData = await db.organization.findUnique({
  //   where: { slug: workspace },
  //   select: {
  //     id: true,
  //     name: true,
  //     _count: {
  //       select: {
  //         members: true,
  //       },
  //     },
  //   },
  // });

  // Check if workspace exists and user is a member
  if (!session) {
    redirect("/login");
  }

  return <PageClient session={session} />;
}

export default Page;
