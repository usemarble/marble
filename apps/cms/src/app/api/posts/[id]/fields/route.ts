import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";

const postFieldValuesPayloadSchema = z.record(
  z.string(),
  z.union([z.string(), z.null()])
);

const fieldValueSchemas = {
  text: z.string(),
  number: z.coerce.number(),
  boolean: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === "true" || value === "false", {
      message: "Boolean fields must be true or false",
    })
    .transform((value) => value === "true"),
  date: z.iso.datetime({ offset: true }).or(z.iso.date()),
  richtext: z.string(),
  select: z.string(),
  multiselect: z.string(),
} as const;

function normalizeFieldValue(
  type: keyof typeof fieldValueSchemas,
  value: string
): { success: true; value: string } | { success: false; message: string } {
  const schema = fieldValueSchemas[type];
  const result = schema.safeParse(value);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? "Invalid field value",
    };
  }

  if (type === "number") {
    return { success: true, value: String(result.data) };
  }

  if (type === "boolean") {
    return { success: true, value: result.data ? "true" : "false" };
  }

  return { success: true, value: String(result.data).trim() };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user || !session.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  const post = await db.post.findFirst({
    where: {
      id: postId,
      workspaceId: session.session.activeOrganizationId,
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Fetch workspace custom field definitions and this post's values
  const [fields, values] = await Promise.all([
    db.customField.findMany({
      where: { workspaceId: session.session.activeOrganizationId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    db.postFieldValue.findMany({
      where: {
        postId,
        workspaceId: session.session.activeOrganizationId,
      },
    }),
  ]);

  // Build a map of fieldId -> value for easy lookup
  const valueMap: Record<string, string> = {};
  for (const v of values) {
    valueMap[v.fieldId] = v.value;
  }

  console.log("[GET /api/posts/[id]/fields]", {
    postId,
    fieldCount: fields.length,
    valueCount: values.length,
    valueMap,
  });

  return NextResponse.json({ fields, values: valueMap }, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user || !session.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  const post = await db.post.findFirst({
    where: {
      id: postId,
      workspaceId: session.session.activeOrganizationId,
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const requestJson = await req.json();
  const payload = postFieldValuesPayloadSchema.safeParse(requestJson);
  const workspaceId = session.session.activeOrganizationId;

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: payload.error.issues },
      { status: 400 }
    );
  }

  const json = payload.data;

  console.log("[PUT /api/posts/[id]/fields]", {
    postId,
    payload: json,
  });

  // Validate all fieldIds belong to this workspace
  const fieldIds = Object.keys(json);
  if (fieldIds.length > 0) {
    const validFields = await db.customField.findMany({
      where: {
        id: { in: fieldIds },
        workspaceId,
      },
      select: {
        id: true,
        key: true,
        name: true,
        type: true,
        required: true,
      },
    });

    const fieldsById = new Map(validFields.map((field) => [field.id, field]));
    const invalidIds = fieldIds.filter((id) => !fieldsById.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "Invalid field IDs", invalidIds },
        { status: 400 }
      );
    }

    for (const [fieldId, rawValue] of Object.entries(json)) {
      const field = fieldsById.get(fieldId);

      if (!field) {
        continue;
      }

      if (rawValue === null || rawValue.trim() === "") {
        if (field.required) {
          return NextResponse.json(
            {
              error: "Required field cannot be empty",
              fieldId,
              key: field.key,
              name: field.name,
            },
            { status: 400 }
          );
        }

        continue;
      }

      const normalized = normalizeFieldValue(field.type, rawValue);

      if (!normalized.success) {
        return NextResponse.json(
          {
            error: "Invalid field value",
            fieldId,
            key: field.key,
            name: field.name,
            type: field.type,
            message: normalized.message,
          },
          { status: 400 }
        );
      }

      json[fieldId] = normalized.value;
    }
  }

  // Upsert each field value
  const operations = Object.entries(json).map(([fieldId, value]) => {
    if (value === null || value === "") {
      // Delete the value if null or empty
      return db.postFieldValue.deleteMany({
        where: {
          postId,
          fieldId,
          workspaceId,
        },
      });
    }

    return db.postFieldValue.upsert({
      where: {
        postId_fieldId: { postId, fieldId },
      },
      update: {
        value: String(value),
        workspaceId,
      },
      create: {
        postId,
        fieldId,
        workspaceId,
        value: String(value),
      },
    });
  });

  await Promise.all(operations);

  return NextResponse.json({ success: true }, { status: 200 });
}
