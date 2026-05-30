import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboardAuthors } from "@/lib/queries/dashboard/authors";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Authors",
  description: "Manage your authors",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const authors = await getDashboardAuthors(workspaceId);
  return <PageClient initialAuthors={authors} />;
}

export default Page;
