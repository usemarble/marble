import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  customFieldsPayloadSchema,
  resolveCustomFieldValues,
} from "@/lib/custom-fields";
import { sanitizeRichTextHtml } from "@/utils/editor";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;
  const { id: postId } = await params;

  const post = await db.post.findFirst({
    where: {
      id: postId,
      workspaceId,
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Fetch workspace custom field definitions and this post's values
  const [fields, values] = await Promise.all([
    db.field.findMany({
      where: { workspaceId },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    db.fieldValue.findMany({
      where: {
        postId,
        workspaceId,
      },
    }),
  ]);

  // Build a map of fieldId -> value for easy lookup
  const valueMap: Record<string, string> = {};
  for (const v of values) {
    valueMap[v.fieldId] = v.value;
  }

  return NextResponse.json({ fields, values: valueMap }, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;
  const { id: postId } = await params;

  const post = await db.post.findFirst({
    where: {
      id: postId,
      workspaceId,
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const requestJson = await req.json();
  const payload = customFieldsPayloadSchema.safeParse(requestJson);

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: payload.error.issues },
      { status: 400 }
    );
  }

  const json = payload.data;

  const fields = await db.field.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      key: true,
      name: true,
      type: true,
      required: true,
      options: {
        select: {
          value: true,
          label: true,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const resolvedValues = resolveCustomFieldValues(fields, json);

  if (!resolvedValues.success) {
    return NextResponse.json(resolvedValues.error, { status: 400 });
  }

  const operations = resolvedValues.values.map(
    ({ fieldId, fieldType, value }) => {
      if (value === null) {
        return db.fieldValue.deleteMany({
          where: {
            postId,
            fieldId,
            workspaceId,
          },
        });
      }

      return db.fieldValue.upsert({
        where: {
          postId_fieldId: { postId, fieldId },
        },
        update: {
          value: fieldType === "richtext" ? sanitizeRichTextHtml(value) : value,
          workspaceId,
        },
        create: {
          postId,
          fieldId,
          workspaceId,
          value: fieldType === "richtext" ? sanitizeRichTextHtml(value) : value,
        },
      });
    }
  );

  if (operations.length > 0) {
    await db.$transaction(operations);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
