import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  customFieldsPayloadSchema,
  resolveCustomFieldValues,
} from "@/lib/custom-fields";
import { sanitizeRichTextHtml } from "@/utils/editor";

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
  const payload = customFieldsPayloadSchema.safeParse(requestJson);
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

    const resolvedValues = resolveCustomFieldValues(validFields, json);

    if (!resolvedValues.success) {
      return NextResponse.json(resolvedValues.error, { status: 400 });
    }

    const operations = resolvedValues.values.map(
      ({ fieldId, fieldType, value }) => {
        if (value === null) {
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
            value:
              fieldType === "richtext" ? sanitizeRichTextHtml(value) : value,
            workspaceId,
          },
          create: {
            postId,
            fieldId,
            workspaceId,
            value:
              fieldType === "richtext" ? sanitizeRichTextHtml(value) : value,
          },
        });
      }
    );

    await Promise.all(operations);
  } else {
    const operations = Object.entries(json).map(([fieldId, value]) => {
      if (value === null || value === "") {
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
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
