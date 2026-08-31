import {
  createRecordId,
  db,
  isFieldWorkspaceKeyConflict,
} from "@marble/drizzle";
import { field, fieldOption } from "@marble/drizzle/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { getDashboardCustomFields } from "@/lib/queries/dashboard/settings";
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
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  return NextResponse.json(await getDashboardCustomFields(workspaceId), {
    status: 200,
  });
}

export async function POST(req: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const json = await req.json();
  const body = customFieldSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const existing = await db.query.field.findFirst({
    where: and(
      eq(field.workspaceId, workspaceId),
      eq(field.key, body.data.key)
    ),
  });

  if (existing) {
    return NextResponse.json(
      { error: "A field with this key already exists in your workspace" },
      { status: 409 }
    );
  }

  const [maxPositionRow] = await db
    .select({ position: field.position })
    .from(field)
    .where(eq(field.workspaceId, workspaceId))
    .orderBy(desc(field.position))
    .limit(1);

  try {
    const fieldId = createRecordId();
    const now = new Date();
    const optionWrites = buildFieldOptionWrites(body.data.options ?? []);

    await db.transaction(async (tx) => {
      await tx.insert(field).values({
        id: fieldId,
        name: body.data.name,
        description: body.data.description?.trim() || null,
        key: body.data.key,
        type: body.data.type,
        required: body.data.required ?? false,
        position: (maxPositionRow?.position ?? -1) + 1,
        workspaceId,
        updatedAt: now,
      });

      if (optionWrites.length > 0) {
        await tx.insert(fieldOption).values(
          optionWrites.map((option) => ({
            id: createRecordId(),
            fieldId,
            workspaceId,
            value: option.value,
            label: option.label,
            position: option.position,
            updatedAt: now,
          }))
        );
      }
    });

    const createdField = await db.query.field.findFirst({
      where: eq(field.id, fieldId),
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
    });

    if (!createdField) {
      return NextResponse.json(
        { error: "Failed to create field" },
        { status: 500 }
      );
    }

    return NextResponse.json(createdField, { status: 201 });
  } catch (error) {
    if (isFieldWorkspaceKeyConflict(error)) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }

    throw error;
  }
}
