import { notFound } from "next/navigation";
import { getDashboardCustomFields } from "@/lib/queries/dashboard/settings";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import { PageClient } from "./page-client";

export const metadata = {
  title: "Custom Fields",
  description: "Define custom fields to extend your post schema.",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const fields = await getDashboardCustomFields(workspaceId);
  return <PageClient initialFields={fields} />;
}

export default Page;
