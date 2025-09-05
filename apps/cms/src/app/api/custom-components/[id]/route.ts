import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, properties } = body;
    const { id } = params;

    const existingComponent = await db.customComponent.findUnique({
      where: { id },
      include: { properties: true },
    });

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Custom component not found" },
        { status: 404 },
      );
    }

    const updatedComponent = await db.$transaction(async (tx) => {
      await tx.componentProperty.deleteMany({
        where: { customComponentId: id },
      });

      return await tx.customComponent.update({
        where: { id },
        data: {
          name,
          description,
          properties: {
            create:
              properties?.map((prop: any) => ({
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
    });

    return NextResponse.json(updatedComponent);
  } catch (error) {
    console.error("Error updating custom component:", error);
    return NextResponse.json(
      { error: "Failed to update custom component" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const existingComponent = await db.customComponent.findUnique({
      where: { id },
    });

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Custom component not found" },
        { status: 404 },
      );
    }

    await db.customComponent.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Custom component deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom component:", error);
    return NextResponse.json(
      { error: "Failed to delete custom component" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const customComponent = await db.customComponent.findUnique({
      where: { id },
      include: {
        properties: true,
      },
    });

    if (!customComponent) {
      return NextResponse.json(
        { error: "Custom component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(customComponent);
  } catch (error) {
    console.error("Error fetching custom component:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom component" },
      { status: 500 },
    );
  }
}
