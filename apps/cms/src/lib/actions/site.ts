"use server";

import db from "@repo/db";
import { authClient } from "../auth/client";
import getSession from "../auth/session";
import { getActiveOrganization } from "../queries/workspace";

export const createTagAction = async (name: string) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeOrg = await getActiveOrganization(session.user.id);
  return await db.tag.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/ /g, "-"),
      workspaceId: activeOrg?.id as string,
    },
  });
};
