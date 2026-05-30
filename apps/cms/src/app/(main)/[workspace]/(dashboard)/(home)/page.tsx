import { notFound } from "next/navigation";
import { getDashboardUsageMetrics } from "@/lib/queries/dashboard/usage";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import PageClient from "./page-client";

export const metadata = {
  title: "Home",
  description: "Workspace overview and metrics",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const usage = await getDashboardUsageMetrics(workspaceId);
  return <PageClient initialUsage={usage} />;
}

export default Page;
