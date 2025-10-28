// app/(main)/[workspace]/layout.tsx
import { notFound } from "next/navigation";
import { setActiveWorkspace } from "@/lib/auth/workspace";
import {
  getInitialWorkspaceData,
  validateWorkspaceAccess,
} from "@/lib/queries/workspace";
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

  const initialWorkspace = await getInitialWorkspaceData();
  if (!initialWorkspace) {
    notFound();
  }

  const workspaceExists = await validateWorkspaceAccess(workspaceSlug);
  if (!workspaceExists) {
    notFound();
  }

  await setActiveWorkspace(workspaceSlug);

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
