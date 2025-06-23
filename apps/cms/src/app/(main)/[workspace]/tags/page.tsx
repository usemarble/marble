import db from "@marble/db";
import { headers } from "next/headers";
import React from "react";
import { auth } from "@/lib/auth/auth";
import PageClient from "./page-client";

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  const tagsToShow = await db.tag.findMany({
    where: { workspaceId: workspace?.id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
  return (
    <div>
      <PageClient tags={tagsToShow} />
    </div>
  );
}

export default Page;
