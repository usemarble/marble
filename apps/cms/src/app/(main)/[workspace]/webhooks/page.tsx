import { db } from "@marble/db";
import { notFound } from "next/navigation";
import { PageClient } from "./page-client";

export const metadata = {
  title: "Webhooks",
  description: "Create webhooks to receive events from your workspace.",
};

interface PageProps {
  params: Promise<{ workspace: string }>;
}

async function Page({ params }: PageProps) {
  const { workspace } = await params;

  const workspaceToShow = await db.organization.findUnique({
    where: { slug: workspace },
    select: { id: true },
  });

  if (!workspaceToShow) {
    return notFound();
  }

  const webhooks = await db.webhook.findMany({
    where: { workspaceId: workspaceToShow.id },
    select: {
      id: true,
      name: true,
      endpoint: true,
      events: true,
      enabled: true,
      format: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <PageClient webhooks={webhooks} />;
}

export default Page;
