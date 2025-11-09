"use server";

import { db } from "@marble/db";
import type { User } from "better-auth";
import { APIError } from "better-auth/api";
import { nanoid } from "nanoid";
import { generateSlug } from "@/utils/string";
import type { Organization } from "../auth/types";
import {
  nameSchema,
  slugSchema,
} from "../validations/workspace";

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

    // Generate slug with nanoid suffix to ensure uniqueness
    const baseSlug = generateSlug(user.name || user.email || "user");
    const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

    // Create new author profile from user data
    const author = await db.author.create({
      data: {
        name: user.name,
        email: user.email,
        slug: uniqueSlug,
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
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to create author profile",
    });
  }
}

export async function validateWorkspaceSlug(slug: string | undefined) {
  const { success } = slugSchema.safeParse({ slug });
  if (!success) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid slug",
    });
  }
}

export async function validateWorkspaceName(name: string | undefined) {
  const { success } = nameSchema.safeParse({ name });
  if (!success) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid name",
    });
  }
}

type ValidateWorkspace = {
  slug: string | undefined;
  name: string | undefined;
};

export async function validateWorkspaceSchema({
  slug,
  name,
}: ValidateWorkspace) {
  await validateWorkspaceSlug(slug);
  await validateWorkspaceName(name);
}
