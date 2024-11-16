"use server";

import { CreateSiteValues, siteSchema } from "../validations/site";
import prisma from "@repo/db";
import getSession from "../auth/get-session";
import { revalidatePath } from "next/cache";

export async function createSiteAction(payload: CreateSiteValues) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = siteSchema.parse(payload);

  const site = await prisma.site.create({
    data: {
      ...parsedPayload,
      slug: parsedPayload.slug.toLocaleLowerCase(),
      ownerId: session.user.id!,
    },
  });

  revalidatePath("/");
  return site;
}

export async function checkSlug(slug: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const site = await prisma.site.findUnique({
    where: { slug },
  });

  return !!site;
}
