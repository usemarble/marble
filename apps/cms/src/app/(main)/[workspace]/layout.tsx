// app/(main)/[workspace]/layout.tsx
import { notFound } from "next/navigation";
import { setActiveWorkspace } from "@/lib/auth/workspace";
import { getWorkspaceLayoutData } from "@/lib/queries/workspace";
import { WorkspaceProvider } from "@/providers/workspace";
import { SetWorkspaceCookie } from "./set-workspace-cookie";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = await params;

  const layoutData = await getWorkspaceLayoutData(workspaceSlug);
  const initialWorkspace = layoutData?.workspace;
  if (!layoutData || !initialWorkspace) {
    notFound();
  }

  if (layoutData.activeOrganizationId !== initialWorkspace.id) {
    await setActiveWorkspace(workspaceSlug);
  }

  return (
    <WorkspaceProvider
      initialWorkspace={initialWorkspace}
      workspaceSlug={workspaceSlug}
    >
      <SetWorkspaceCookie workspaceSlug={workspaceSlug} />
      {children}
    </WorkspaceProvider>
  );
}
