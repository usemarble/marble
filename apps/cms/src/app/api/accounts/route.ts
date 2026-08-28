import { db } from "@marble/drizzle";
import { account, user } from "@marble/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
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

    const accountDetails = userAccountDetails.map((account) => ({
      id: account.id,
      createdAt: account.createdAt,
      providerId: account.providerId,
      accountId: account.accountId,
      email: account.email,
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
