import { notFound } from "next/navigation";
import {
  getDashboardApiKeys,
  getDashboardWorkspaceId,
} from "@/lib/queries/dashboard";
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
