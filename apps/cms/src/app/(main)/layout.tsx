import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserProvider } from "@/providers/user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.emailVerified) {
    redirect(`/verify?email=${encodeURIComponent(session.user.email)}`);
  }

  return (
    <UserProvider initialUser={null}>
      <div>{children}</div>
    </UserProvider>
  );
}
