import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userAccountDetails = await db.account.findMany({
      where: {
        userId: sessionData.user.id,
      },
      select: {
        id: true,
        createdAt: true,
        providerId: true,
        accountId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const accountDetails = userAccountDetails.map((account) => ({
      id: account.id,
      createdAt: account.createdAt,
      providerId: account.providerId,
      accountId: account.accountId,
      email: account.user.email,
    }));

    return NextResponse.json(accountDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching account details:", error);
    return NextResponse.json(
      { error: "Failed to fetch account details" },
      { status: 500 },
    );
  }
}
