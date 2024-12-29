"use server";

import db from "@repo/db";
import { revalidatePath } from "next/cache";
import getSession from "../auth/session";
import { type CreateSiteValues, siteSchema } from "../validations/site";

export async function createSiteAction(
  payload: CreateSiteValues,
  workspaceSlug: string,
) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = siteSchema.parse(payload);

  const workspaceMatch = await db.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  if (!workspaceMatch) {
    throw new Error("Workspace not found");
  }

  const site = await db.site.create({
    data: {
      ...parsedPayload,
      workspaceId: workspaceMatch.id,
    },
  });

  revalidatePath("/");
  return site;
}


// export const createTagAction = async (name: string) => {
//   const session = await getSession();
//   if (!session?.user) {
//     throw new Error("Unauthorized");
//   }

//   return await prisma.tag.create({
//     data: {
//       name,
//       slug,
//       siteId: session.user.id,
//     },
//   });
// }