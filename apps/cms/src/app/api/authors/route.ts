import db from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const authors = await db.user.findMany({
    where: {
      members: {
        some: {
          organizationId: session.session?.activeOrganizationId as string,
        },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return NextResponse.json(authors, { status: 200 });
}
