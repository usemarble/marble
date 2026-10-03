import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { UserProvider } from "@/providers/user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, error } = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <UserProvider initialUser={null}>
      <div>{children}</div>
    </UserProvider>
  );
}
