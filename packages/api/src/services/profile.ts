import { user } from "@marble/db/schema";
import { eq } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";

export class ProfileError extends Error {
  readonly status: 401 | 500;
  constructor(status: 401 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

const profileSelect = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

export async function getProfile(ctx: ServiceContext, userId: string) {
  const [row] = await ctx.db
    .select(profileSelect)
    .from(user)
    .where(eq(user.id, userId));
  if (!row) {
    throw new ProfileError(401, "Not authenticated");
  }
  return row;
}

/**
 * A blank name is ignored rather than rejected, and an empty image string
 * clears the avatar, as the CMS route did.
 */
export async function updateProfile(
  ctx: ServiceContext,
  userId: string,
  input: { name?: string; image?: string }
) {
  const updateData: { name?: string; image?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined && input.name.trim().length > 0) {
    updateData.name = input.name.trim();
  }
  if (input.image !== undefined) {
    updateData.image = input.image;
  }

  try {
    await transact(ctx, ({ tx }) =>
      tx.update(user).set(updateData).where(eq(user.id, userId))
    );
  } catch (error) {
    ctx.log.error(error instanceof Error ? error : new Error(String(error)));
    throw new ProfileError(500, "Failed to update user");
  }
  return getProfile(ctx, userId);
}
