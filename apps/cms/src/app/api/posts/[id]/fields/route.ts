import { db, createRecordId } from "@marble/drizzle";
import { field, fieldOption, fieldValue, post } from "@marble/drizzle/schema";
import { sanitizeRichTextHtml } from "@marble/utils/sanitize";

import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  customFieldsPayloadSchema,
  resolveCustomFieldValues,
} from "@/lib/custom-fields";

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

  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
    columns: { id: true },
  });

  if (!postRow) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [fields, values] = await Promise.all([
    db.query.field.findMany({
      where: eq(field.workspaceId, workspaceId),
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
      orderBy: [asc(field.position), asc(field.createdAt)],
    }),
    db.query.fieldValue.findMany({
      where: and(
        eq(fieldValue.postId, postId),
        eq(fieldValue.workspaceId, workspaceId)
      ),
    }),
  ]);

  const valueMap: Record<string, string> = {};
  for (const value of values) {
    valueMap[value.fieldId] = value.value;
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

  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
    columns: { id: true },
  });

  if (!postRow) {
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

  const fields = await db.query.field.findMany({
    where: eq(field.workspaceId, workspaceId),
    columns: {
      id: true,
      key: true,
      name: true,
      type: true,
      required: true,
    },
    with: {
      options: {
        columns: {
          value: true,
          label: true,
        },
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
  });

  const resolvedValues = resolveCustomFieldValues(fields, json);

  if (!resolvedValues.success) {
    return NextResponse.json(resolvedValues.error, { status: 400 });
  }

  if (resolvedValues.values.length > 0) {
    await db.transaction(async (tx) => {
      const now = new Date();

      await Promise.all(
        resolvedValues.values.map(async ({ fieldId, fieldType, value }) => {
          if (value === null) {
            await tx
              .delete(fieldValue)
              .where(
                and(
                  eq(fieldValue.postId, postId),
                  eq(fieldValue.fieldId, fieldId),
                  eq(fieldValue.workspaceId, workspaceId)
                )
              );
            return;
          }

          const storedValue =
            fieldType === "richtext" ? sanitizeRichTextHtml(value) : value;

          await tx
            .insert(fieldValue)
            .values({
              id: createRecordId(),
              postId,
              fieldId,
              workspaceId,
              value: storedValue,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: [fieldValue.postId, fieldValue.fieldId],
              set: {
                value: storedValue,
                workspaceId,
                updatedAt: now,
              },
            });
        })
      );
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
