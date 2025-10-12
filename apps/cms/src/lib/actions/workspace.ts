"use server";

import { db } from "@marble/db";
import type { User } from "better-auth";
import { APIError } from "better-auth/api";
import { generateSlug } from "@/utils/string";
import type { Organization } from "../auth/types";
import {
  nameSchema,
  slugSchema,
  timezoneSchema,
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

export async function validateWorkspaceSlug(slug: string | undefined) {
  const { error } = await slugSchema.safeParse({ slug });
  if (error) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid slug",
    });
  }
}

export async function validateWorkspaceName(name: string | undefined) {
  const { error } = await nameSchema.safeParse({ name });
  if (error) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid name",
    });
  }
}

export async function validateWorkspaceTimezone(timezone: string | undefined) {
  const { error } = await timezoneSchema.safeParse({ timezone });
  if (error) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid timezone",
    });
  }
}

type ValidateWorkspace = {
  slug: string | undefined;
  name: string | undefined;
  timezone: string | undefined;
};

export async function validateWorkspaceSchema({
  slug,
  name,
  timezone,
}: ValidateWorkspace) {
  await validateWorkspaceSlug(slug);
  await validateWorkspaceName(name);
  await validateWorkspaceTimezone(timezone);
}
