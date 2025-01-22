import getServerSession from "@/lib/auth/session";
import { getFirstOrganization } from "@/utils/organization";
import { redirect } from "next/navigation";

async function Page() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const firstWorkspaceSlug = await getFirstOrganization(session.user.id);
  if (firstWorkspaceSlug) {
    redirect(`/${firstWorkspaceSlug}`);
  }

  redirect("/onboarding");
}

export default Page;
