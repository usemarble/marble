import db from "@repo/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const workspaceToShow = await db.workspace.findUnique({
    where: { slug: workspace },
    select: { id: true },
  });

  if (!workspaceToShow) {
    return notFound();
  }

  const workspaceSites = await db.site.findMany({
    where: { workspaceId: workspaceToShow.id },
    select: { name: true, description: true, id: true },
  });

  return <PageClient sites={workspaceSites} />;
}

export default Page;
