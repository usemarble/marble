import { notFound } from "next/navigation";
import {
  getDashboardCategories,
  getDashboardWorkspaceId,
} from "@/lib/queries/dashboard";
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
