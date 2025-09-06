import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  type ComponentPropertyValues,
  componentUpdateSchema,
} from "@/lib/validations/components";

type PropertyType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "textarea"
  | "select";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const validatedData = componentUpdateSchema.parse(json);
    const { name, description, properties } = validatedData;
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
              properties?.map((prop: ComponentPropertyValues) => ({
                name: prop.name,
                type: prop.type as PropertyType,
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

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as {
        errors: { path: string[]; message: string }[];
      };
      return NextResponse.json(
        {
          error: "Validation failed",
          details: zodError.errors?.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update custom component" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingComponent = await db.customComponent.findUnique({
    where: { id, workspaceId: sessionData.session.activeOrganizationId },
  });

  if (!existingComponent) {
    return NextResponse.json(
      { error: "Custom component not found" },
      { status: 404 },
    );
  }

  try {
    await db.customComponent.delete({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const customComponent = await db.customComponent.findUnique({
      where: { id, workspaceId: sessionData.session.activeOrganizationId },
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
