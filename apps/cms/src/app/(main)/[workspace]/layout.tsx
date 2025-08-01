import { getInitialWorkspaceData } from "@/lib/queries/workspace";
import { WorkspaceProvider } from "@/providers/workspace";

/**
 * Asynchronously loads initial workspace data and provides it to child components via `WorkspaceProvider`.
 *
 * Awaits the `params` promise to extract the workspace identifier, retrieves initial workspace data, and renders the children within the context of the workspace.
 *
 * @param children - The React nodes to render within the workspace context
 * @param params - A promise resolving to an object containing the workspace identifier
 */
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
