import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  type ComponentPropertyValues,
  componentSchema,
} from "@/lib/validations/components";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customComponents = await db.customComponent.findMany({
      where: { workspaceId: sessionData.session?.activeOrganizationId },
      include: {
        properties: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customComponents, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to fetch custom components" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = componentSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const { name, description, properties } = parsedBody.data;

  try {
    const customComponent = await db.customComponent.create({
      data: {
        name,
        description,
        workspaceId: sessionData.session.activeOrganizationId,
        properties: {
          create:
            properties?.map((prop: ComponentPropertyValues) => ({
              name: prop.name,
              type: prop.type,
              required: prop.required || false,
              defaultValue: prop.defaultValue,
            })) || [],
        },
      },
      include: {
        properties: true,
      },
    });

    return NextResponse.json(customComponent, { status: 201 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to create custom component" },
      { status: 500 },
    );
  }
}
