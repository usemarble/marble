import { getInitialWorkspaceData } from "@/lib/queries/workspace";
import { WorkspaceProvider } from "@/providers/workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  console.log("workspace at layout", workspace);

  const initialWorkspace = await getInitialWorkspaceData();

  return (
    <WorkspaceProvider initialWorkspace={initialWorkspace}>
      {children}
    </WorkspaceProvider>
  );
}
