import { UserProvider } from "@/providers/user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider initialUser={null}>
      <div>{children}</div>
    </UserProvider>
  );
}
