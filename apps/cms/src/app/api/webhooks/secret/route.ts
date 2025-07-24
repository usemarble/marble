import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = randomBytes(32).toString("hex");
    return NextResponse.json({ success: true, secret }, { status: 200 });
  } catch (error) {
    console.error("Failed to generate webhook secret:", error);
    return NextResponse.json({ success: false, secret: null }, { status: 500 });
  }
}
