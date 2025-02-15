"use server";

import db from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";

export async function updateUserAction(
  payload: { email: string; name: string },
  id: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: id },
    data: payload,
  });
}
