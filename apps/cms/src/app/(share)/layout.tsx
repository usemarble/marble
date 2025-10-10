export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="grid min-h-dvh">{children}</div>;
}
