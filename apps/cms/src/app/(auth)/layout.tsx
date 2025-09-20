export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="grid min-h-dvh">{children}</div>;
}
