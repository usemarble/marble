import PageLoader from "@/components/shared/page-loader";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full">{children}</div>;
}

