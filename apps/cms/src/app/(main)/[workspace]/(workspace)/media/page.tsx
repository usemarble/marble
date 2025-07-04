import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import PageClient from "./page-client";

export const metadata = {
  title: "Media",
  description: "Manage your media",
};

async function Page() {
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
