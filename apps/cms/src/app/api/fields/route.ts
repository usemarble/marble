import { db } from "@marble/db";
import type { FieldType as PrismaFieldType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { customFieldSchema } from "@/lib/validations/fields";

function buildFieldOptionWrites(
  options: Array<{ value: string; label: string }>
) {
  return options.map((option, index) => ({
    value: option.value,
    label: option.label,
    position: index,
  }));
}

export async function GET() {
  const sessionData = await getServerSession();
  const activeOrganizationId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = await db.field.findMany({
    where: {
      workspaceId: activeOrganizationId,
    },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(fields, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();
  const activeOrganizationId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = customFieldSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  // Check key uniqueness within workspace
  const existing = await db.field.findFirst({
    where: {
      workspaceId: activeOrganizationId,
      key: body.data.key,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A field with this key already exists in your workspace" },
      { status: 409 }
    );
  }

  // Get the next position value
  const maxPosition = await db.field.aggregate({
    where: {
      workspaceId: activeOrganizationId,
    },
    _max: {
      position: true,
    },
  });

  const field = await db.field.create({
    data: {
      name: body.data.name,
      description: body.data.description?.trim() || null,
      key: body.data.key,
      type: body.data.type as PrismaFieldType,
      required: body.data.required ?? false,
      position: (maxPosition._max.position ?? -1) + 1,
      workspaceId: activeOrganizationId,
      options:
        (body.data.options ?? []).length > 0
          ? {
              create: buildFieldOptionWrites(body.data.options ?? []),
            }
          : undefined,
    },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json(field, { status: 201 });
}
