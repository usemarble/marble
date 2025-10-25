import { notFound, redirect } from "next/navigation";
import { setActiveWorkspace } from "@/lib/auth/workspace";
import { getInitialWorkspaceData } from "@/lib/queries/workspace";
import { WorkspaceProvider } from "@/providers/workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspace: string };
}) {
  const workspaceSlug = (await params).workspace;
  const initialWorkspace = await getInitialWorkspaceData();

  if (!initialWorkspace) {
    notFound();
  }

  await setActiveWorkspace(workspaceSlug);

  if (!initialWorkspace) {
    notFound();
  }

  await setActiveWorkspace(workspaceSlug);

  return (
    <WorkspaceProvider initialWorkspace={initialWorkspace}>
      {children}
    </WorkspaceProvider>
  );
}
