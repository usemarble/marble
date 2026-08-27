import { db } from "@marble/drizzle";
import {
  author,
  category,
  field,
  fieldOption,
  fieldValue,
  post,
  postToAuthor,
  postToTag,
} from "@marble/drizzle/schema";
import { toPostPayload, withChanges } from "@marble/events";
import { sanitizeHtml, sanitizeRichTextHtml } from "@marble/utils/sanitize";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { resolveCustomFieldValues } from "@/lib/custom-fields";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { postUpsertSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";

async function buildCustomFieldWrites(
  workspaceId: string,
  input: Record<string, string | null | undefined>
): Promise<ReturnType<typeof resolveCustomFieldValues>> {
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

  return resolveCustomFieldValues(fields, input);
}

async function writeCustomFieldValues(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  workspaceId: string,
  postId: string,
  writes: Extract<
    Awaited<ReturnType<typeof resolveCustomFieldValues>>,
    { success: true }
  >
) {
  if (writes.values.length === 0) {
    return;
  }

  const now = new Date();

  await Promise.all(
    writes.values.map(async ({ fieldId, fieldType, value }) => {
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
          id: createId(),
          postId,
          fieldId,
          workspaceId,
          value: storedValue,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [fieldValue.postId, fieldValue.fieldId],
          set: {
            workspaceId,
            value: storedValue,
            updatedAt: now,
          },
        });
    })
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, id), eq(post.workspaceId, workspaceId)),
    columns: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      content: true,
      coverImage: true,
      description: true,
      publishedAt: true,
      contentJson: true,
      categoryId: true,
    },
  });

  if (!postRow) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [tagLinks, authorLinks] = await Promise.all([
    db
      .select({ id: postToTag.b })
      .from(postToTag)
      .where(eq(postToTag.a, id)),
    db
      .select({ id: postToAuthor.a })
      .from(postToAuthor)
      .where(eq(postToAuthor.b, id)),
  ]);

  const structuredData = {
    slug: postRow.slug,
    title: postRow.title,
    status: postRow.status,
    featured: postRow.featured,
    content: postRow.content,
    coverImage: postRow.coverImage,
    description: postRow.description,
    publishedAt: postRow.publishedAt,
    contentJson: JSON.stringify(postRow.contentJson),
    tags: tagLinks.map((tag) => tag.id),
    category: postRow.categoryId,
    authors: authorLinks.map((authorRow) => authorRow.id),
  };

  return NextResponse.json(structuredData, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const body = await request.json();

  const values = postUpsertSchema.safeParse(body);

  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const existingPostWithSlug = await db.query.post.findFirst({
    where: and(
      eq(post.slug, values.data.slug),
      eq(post.workspaceId, workspaceId),
      ne(post.id, id)
    ),
  });

  if (existingPostWithSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const contentJson = JSON.parse(values.data.contentJson);
  const cleanContent = sanitizeHtml(values.data.content);

  const tagValidation = await validateWorkspaceTags(
    values.data.tags,
    workspaceId
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  if (values.data.category) {
    const categoryRow = await db.query.category.findFirst({
      where: and(
        eq(category.id, values.data.category),
        eq(category.workspaceId, workspaceId)
      ),
    });

    if (!categoryRow) {
      return NextResponse.json(
        { error: "Invalid category provided" },
        { status: 400 }
      );
    }
  }

  const authorIds = values.data.authors ?? [];

  const validAuthors = await db.query.author.findMany({
    where: and(
      inArray(author.id, authorIds),
      eq(author.workspaceId, workspaceId)
    ),
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 }
    );
  }

  const primaryAuthor = validAuthors[0];

  if (!primaryAuthor) {
    return NextResponse.json(
      { error: "Unable to determine primary author" },
      { status: 500 }
    );
  }

  const existingPost = await db.query.post.findFirst({
    where: and(eq(post.id, id), eq(post.workspaceId, workspaceId)),
    columns: { status: true },
  });

  if (!existingPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const customFieldWrites = await buildCustomFieldWrites(
      workspaceId,
      values.data.customFields
    );

    if (!customFieldWrites.success) {
      return NextResponse.json(customFieldWrites.error, { status: 400 });
    }

    const postUpdated = await db.transaction(async (tx) => {
      const now = new Date();

      const [updatedPost] = await tx
        .update(post)
        .set({
          primaryAuthorId: primaryAuthor.id,
          contentJson,
          slug: values.data.slug,
          title: values.data.title,
          status: values.data.status,
          featured: values.data.featured,
          content: cleanContent,
          categoryId: values.data.category,
          coverImage: values.data.coverImage,
          description: values.data.description,
          publishedAt: values.data.publishedAt,
          workspaceId,
          updatedAt: now,
        })
        .where(and(eq(post.id, id), eq(post.workspaceId, workspaceId)))
        .returning();

      if (!updatedPost) {
        throw new Error("Post not found");
      }

      if (values.data.tags) {
        await tx.delete(postToTag).where(eq(postToTag.a, id));

        if (uniqueTagIds.length > 0) {
          await tx.insert(postToTag).values(
            uniqueTagIds.map((tagId) => ({
              a: id,
              b: tagId,
            }))
          );
        }
      }

      await tx.delete(postToAuthor).where(eq(postToAuthor.b, id));
      await tx.insert(postToAuthor).values(
        validAuthors.map((authorRow) => ({
          a: authorRow.id,
          b: id,
        }))
      );

      await writeCustomFieldValues(tx, workspaceId, id, customFieldWrites);

      return updatedPost;
    });

    const eventType =
      existingPost.status !== "published" && postUpdated.status === "published"
        ? "post_published"
        : existingPost.status === "published" &&
            postUpdated.status !== "published"
          ? "post_unpublished"
          : "post_updated";
    const payload =
      eventType === "post_updated"
        ? withChanges(toPostPayload(postUpdated), Object.keys(values.data))
        : toPostPayload(postUpdated);

    await emitDashboardEvent({
      type: eventType,
      workspaceId,
      resourceType: "post",
      resourceId: postUpdated.id,
      actorId: sessionData.user.id,
      payload,
    }).catch(logDashboardEventError);

    invalidateCache(workspaceId, "posts");

    return NextResponse.json({ id: postUpdated.id }, { status: 200 });
  } catch (error) {
    console.error(`[PostUpdate] Error updating post ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;
  const { id } = await params;

  try {
    const [deletedPost] = await db
      .delete(post)
      .where(and(eq(post.id, id), eq(post.workspaceId, workspaceId)))
      .returning();

    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await emitDashboardEvent({
      type: "post_deleted",
      workspaceId,
      resourceType: "post",
      resourceId: id,
      actorId: sessionData.user.id,
      payload: toPostPayload(deletedPost),
    }).catch(logDashboardEventError);

    invalidateCache(workspaceId, "posts");

    return NextResponse.json({ id: deletedPost.id }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
