"use server";

import db from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";

/**
 * Update a user
 * @param payload - The payload to update the user with
 * @param id - The user ID
 * @returns The updated user
 */
export async function updateUserAction(
  payload: { email: string; name: string },
  id: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.update({
    where: { id: id },
    data: payload,
  });

  return user;
}
