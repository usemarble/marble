import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import PageClient from "./page-client";

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  const media = await db.media.findMany({
    where: { workspaceId: workspace?.id },
    select: {
      id: true,
      name: true,
      url: true,
    },
  });
  return <PageClient media={media} />;
}

export default Page;
