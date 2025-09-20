export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh grid">{children}</div>;
}
