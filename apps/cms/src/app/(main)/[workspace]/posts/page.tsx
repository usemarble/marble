import { db } from "@marble/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

export const metadata = {
  title: "Posts",
  description: "Manage your posts",
};

async function Page(params: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params.params;

  const workspaceToShow = await db.organization.findUnique({
    where: { slug: workspace },
    select: { id: true },
  });

  if (!workspaceToShow) {
    return notFound();
  }

  const workspacePosts = await db.post.findMany({
    where: { workspaceId: workspaceToShow.id },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return <PageClient posts={workspacePosts} />;
}

export default Page;
