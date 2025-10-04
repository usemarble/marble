import { UserProvider } from "@/providers/user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserProvider initialUser={null}>{children}</UserProvider>;
}
