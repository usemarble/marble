import db from "@repo/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const workspaceData = await db.workspace.findUnique({
    where: { slug: workspace },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          sites: true,
          members: true,
        },
      },
    },
  });

  if (!workspaceData) {
    return notFound();
  }

  return <PageClient workspace={workspaceData} />;
}

export default Page;
