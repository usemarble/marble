import { db } from "@marble/db";
import { account, user } from "@marble/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth/client";

export async function GET() {
  const { data: sessionData, error: sessionError } =
    await authClient.getSession({
      fetchOptions: { headers: await headers() },
    });
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!sessionData?.user.emailVerified) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userAccountDetails = await db
      .select({
        id: account.id,
        createdAt: account.createdAt,
        providerId: account.providerId,
        accountId: account.accountId,
        email: user.email,
      })
      .from(account)
      .innerJoin(user, eq(account.userId, user.id))
      .where(eq(account.userId, sessionData.user.id));

    const accountDetails = userAccountDetails.map((accountRow) => ({
      id: accountRow.id,
      createdAt: accountRow.createdAt,
      providerId: accountRow.providerId,
      accountId: accountRow.accountId,
      email: accountRow.email,
    }));

    return NextResponse.json(accountDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching account details:", error);
    return NextResponse.json(
      { error: "Failed to fetch account details" },
      { status: 500 }
    );
  }
}
