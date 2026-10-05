import { account, user } from "@marble/db/schema";
import { and, eq } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";

export class AccountError extends Error {}

/** The caller's sign-in methods. Tokens and passwords are never selected. */
export async function listAccounts(ctx: ServiceContext, userId: string) {
  try {
    return await ctx.db
      .select({
        id: account.id,
        createdAt: account.createdAt,
        providerId: account.providerId,
        accountId: account.accountId,
        email: user.email,
      })
      .from(account)
      .innerJoin(user, eq(account.userId, user.id))
      .where(eq(account.userId, userId));
  } catch (error) {
    ctx.log.error(error instanceof Error ? error : new Error(String(error)));
    throw new AccountError("Failed to fetch account details");
  }
}

/**
 * Unlinks one of the caller's accounts. An unknown or someone else's ID
 * deletes nothing and succeeds, as the CMS route did.
 */
export async function deleteAccount(
  ctx: ServiceContext,
  userId: string,
  id: string
) {
  await transact(ctx, ({ tx }) =>
    tx
      .delete(account)
      .where(and(eq(account.id, id), eq(account.userId, userId)))
  );
}
