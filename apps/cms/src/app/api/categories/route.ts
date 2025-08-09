import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(categories, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const user = session?.user;

  if (!(user && session?.session.activeOrganizationId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = categorySchema.parse(json);

  const category = await db.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
