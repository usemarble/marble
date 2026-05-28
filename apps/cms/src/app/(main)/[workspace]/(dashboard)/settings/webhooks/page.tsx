import { notFound } from "next/navigation";
import {
  getDashboardWebhooks,
  getDashboardWorkspaceId,
} from "@/lib/queries/dashboard";
import { PageClient } from "./page-client";

export const metadata = {
  title: "Webhooks",
  description: "Create webhooks to receive events from your workspace.",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const webhooks = await getDashboardWebhooks(workspaceId);
  return <PageClient initialWebhooks={webhooks} />;
}

export default Page;
