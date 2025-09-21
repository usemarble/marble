"use server";

import { db } from "@marble/db";
import type { User } from "better-auth";
import { generateSlug } from "@/utils/string";
import type { Organization } from "../auth/types";

export async function createAuthor(user: User, organization: Organization) {
  try {
    const existingAuthor = await db.author.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: organization.id,
          userId: user.id,
        },
      },
    });

    if (existingAuthor) {
      console.log(
        "Author already exists for user",
        user.id,
        "in workspace",
        organization.id
      );
      return existingAuthor;
    }

    // Create new author profile from user data
    const author = await db.author.create({
      data: {
        name: user.name,
        email: user.email,
        slug: generateSlug(user.name),
        image: user.image,
        workspaceId: organization.id,
        userId: user.id,
        role: "Member",
      },
    });

    console.log(
      "Created author for user",
      user.id,
      "in workspace",
      organization.id
    );
    return author;
  } catch (error) {
    console.error("Failed to create author:", error);
    throw error;
  }
}
