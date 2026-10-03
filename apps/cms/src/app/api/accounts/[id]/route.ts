import { db } from "@marble/db";
import { account } from "@marble/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session, error: sessionError } = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.user.emailVerified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(account)
    .where(and(eq(account.id, id), eq(account.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
