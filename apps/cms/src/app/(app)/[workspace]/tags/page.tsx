import db from "@repo/db";
import React from "react";
import PageClient from "./page-client";

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;

  const tagsToShow = await db.tag.findMany({
    where: { workspaceId: workspace },
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
