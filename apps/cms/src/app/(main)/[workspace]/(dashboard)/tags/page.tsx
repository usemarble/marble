import { notFound } from "next/navigation";
import { getDashboardTags } from "@/lib/queries/dashboard/taxonomy";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import PageClient from "./page-client";

export const metadata = {
  title: "Tags",
  description: "Manage your tags",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const tags = await getDashboardTags(workspaceId);
  return <PageClient initialTags={tags} />;
}

export default Page;
