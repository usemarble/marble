import db from "@repo/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const workspaceToShow = await db.organization.findUnique({
    where: { slug: workspace },
    select: { id: true },
  });

  if (!workspaceToShow) {
    return notFound();
  }

  const workspaceSites = await db.post.findMany({
    where: { workspaceId: workspaceToShow.id },
    select: { title: true, description: true, id: true, workspaceId: true },
  });

  return <PageClient posts={workspaceSites} />;
}

export default Page;
