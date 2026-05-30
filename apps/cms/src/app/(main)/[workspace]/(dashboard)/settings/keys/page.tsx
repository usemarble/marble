import { notFound } from "next/navigation";
import { getDashboardApiKeys } from "@/lib/queries/dashboard/settings";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import PageClient from "./page-client";

export const metadata = {
  title: "API Keys",
  description: "Manage your API keys",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const keys = await getDashboardApiKeys(workspaceId);
  return <PageClient initialKeys={keys} />;
}

export default Page;
