import { WorkspaceProvider } from "@/providers/workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = await params;

  return (
    <WorkspaceProvider workspaceSlug={workspaceSlug}>
      {children}
    </WorkspaceProvider>
  );
}
