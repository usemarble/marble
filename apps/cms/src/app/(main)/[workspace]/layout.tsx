import { getInitialWorkspaceData } from "@/lib/queries/workspace";
import { WorkspaceProvider } from "@/providers/workspace";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialWorkspace = await getInitialWorkspaceData();

  return (
    <WorkspaceProvider initialWorkspace={initialWorkspace}>
      {children}
    </WorkspaceProvider>
  );
}
