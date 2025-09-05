import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/session";
import { PageClient } from "./page-client";

export default async function ComponentsPage({
  params,
}: {
  params: { workspace: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspace } = params;

  return <PageClient workspaceSlug={workspace} />;
}
