import { db } from "@marble/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
  }

  try {
    const customComponents = await db.customComponent.findMany({
      where: {
        workspaceId,
      },
      include: {
        properties: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customComponents);
  } catch (error) {
    console.error("Error fetching custom components:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom components" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, workspaceId, properties } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: "Name and workspace ID are required" },
        { status: 400 }
      );
    }

    const customComponent = await db.customComponent.create({
      data: {
        name,
        description,
        workspaceId,
        properties: {
          create: properties?.map((prop: any) => ({
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
  } catch (error) {
    console.error("Error creating custom component:", error);
    return NextResponse.json(
      { error: "Failed to create custom component" },
      { status: 500 }
    );
  }
}