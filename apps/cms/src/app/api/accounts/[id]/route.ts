import { db } from "@marble/drizzle";
import { account } from "@marble/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(account)
    .where(and(eq(account.id, id), eq(account.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
