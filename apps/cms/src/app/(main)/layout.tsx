import { getInitialUserData } from "@/lib/queries/user";
import { UserProvider } from "@/providers/user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: initialUser, isAuthenticated } = await getInitialUserData();

  return (
    <UserProvider
      initialUser={initialUser}
      initialIsAuthenticated={isAuthenticated}
    >
      {children}
    </UserProvider>
  );
}
