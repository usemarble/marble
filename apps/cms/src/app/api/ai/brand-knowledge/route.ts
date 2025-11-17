import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({}, { status: 200 });
}

export async function POST() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({}, { status: 200 });
}
