import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import PageClient from "./page-client";

async function Page() {
  const [session, organization] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.getFullOrganization({
      headers: await headers(),
    }),
  ]);

  if (!organization || !session) {
    return <div>Something went wrong</div>;
  }

  const ownerId = organization.members.find((m) => m.role === "member")?.id;
  const isOwner = session.user.id === ownerId;

  return <PageClient activeWorkspace={organization} session={session} />;
}

export default Page;
