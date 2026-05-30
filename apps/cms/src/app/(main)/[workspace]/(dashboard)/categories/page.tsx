import { notFound } from "next/navigation";
import { getDashboardCategories } from "@/lib/queries/dashboard/taxonomy";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import PageClient from "./page-client";

export const metadata = {
  title: "Categories",
  description: "Manage your categories",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const categories = await getDashboardCategories(workspaceId);
  return <PageClient initialCategories={categories} />;
}

export default Page;
