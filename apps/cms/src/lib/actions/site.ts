"use server";

import db from "@repo/db";
import getSession from "../auth/session";
import { authClient } from "../auth/client";


export const createTagAction = async (name: string) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeOrg = await authClient.useActiveOrganization();
  return await db.tag.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/ /g, "-"),
      workspaceId: activeOrg.data.id,
    },
  });
}