import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import PageClient from "./page-client";

async function Page() {
  const workspace = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  const availableCategories = await db.category.findMany({
    where: { workspaceId: workspace?.id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
  return (
    <div>
      <PageClient categories={availableCategories} />
    </div>
  );
}

export default Page;
