"use server";

import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "../auth/session";

/**
 * Update a user
 * @param payload - The payload to update the user with
 * @param id - The user ID
 * @returns The updated user
 */
export async function updateUserAction(payload: { name: string }, id: string) {
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

export async function deleteAccountAction(id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userToDelete = await db.user.findUnique({
    where: { id: id },
  });

  if (!userToDelete) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.user.delete({
    where: { id: id },
  });

  return NextResponse.json({ message: "User deleted" }, { status: 200 });
}
