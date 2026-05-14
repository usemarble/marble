import { db } from "@marble/db";
import { toPostPayload, withChanges } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  type CustomFieldValidationDefinition,
  resolveCustomFieldValues,
} from "@/lib/custom-fields";
import { emitDashboardEvent, logDashboardEventError } from "@/lib/events/fire";
import { postUpsertSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { sanitizeHtml, sanitizeRichTextHtml } from "@/utils/editor";

async function buildCustomFieldWrites(
  workspaceId: string,
  input: Record<string, string | null | undefined>
): Promise<ReturnType<typeof resolveCustomFieldValues>> {
  const fieldIds = Object.keys(input);

  if (fieldIds.length === 0) {
    return {
      success: true,
      values: [] as Array<{
        fieldId: string;
        fieldType: CustomFieldValidationDefinition["type"];
        value: string | null;
      }>,
    };
  }

  const fields = await db.field.findMany({
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
      options: {
        select: {
          value: true,
          label: true,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return resolveCustomFieldValues(
    fields as CustomFieldValidationDefinition[],
    input
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const post = await db.post.findFirst({
    where: { id, workspaceId: activeWorkspaceId },
    select: {
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
      tags: {
        select: { id: true },
      },
      authors: {
        select: { id: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const structuredData = {
    slug: post.slug,
    title: post.title,
    status: post.status,
    featured: post.featured,
    content: post.content,
    coverImage: post.coverImage,
    description: post.description,
    publishedAt: post.publishedAt,
    contentJson: JSON.stringify(post.contentJson),
    tags: post.tags.map((tag) => tag.id),
    category: post.categoryId,
    authors: post.authors.map((author) => author.id),
  };

  return NextResponse.json(structuredData, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const values = postUpsertSchema.safeParse(body);

  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const existingPostWithSlug = await db.post.findFirst({
    where: {
      slug: values.data.slug,
      workspaceId,
      id: { not: id },
    },
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
    const category = await db.category.findFirst({
      where: {
        id: values.data.category,
        workspaceId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category provided" },
        { status: 400 }
      );
    }
  }

  // Find all authors for the provided author IDs
  const validAuthors = await db.author.findMany({
    where: {
      id: { in: values.data.authors },
      workspaceId,
    },
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 }
    );
  }

  // Use the first valid author as primary
  const primaryAuthor = validAuthors[0];

  if (!primaryAuthor) {
    // This should never happen since validAuthors.length > 0
    return NextResponse.json(
      { error: "Unable to determine primary author" },
      { status: 500 }
    );
  }

  const post = await db.post.findFirst({
    where: { id, workspaceId },
    select: { status: true },
  });

  if (!post) {
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

    const postUpdated = await db.$transaction(async (tx) => {
      const updatedPost = await tx.post.update({
        where: { id },
        data: {
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
          tags: values.data.tags
            ? { set: uniqueTagIds.map((tagId) => ({ id: tagId })) }
            : undefined,
          authors: {
            set: validAuthors.map((author) => ({ id: author.id })),
          },
        },
      });

      if (customFieldWrites.values.length > 0) {
        await Promise.all(
          customFieldWrites.values.map(({ fieldId, fieldType, value }) => {
            if (value === null) {
              return tx.fieldValue.deleteMany({
                where: {
                  postId: id,
                  fieldId,
                  workspaceId,
                },
              });
            }

            return tx.fieldValue.upsert({
              where: {
                postId_fieldId: { postId: id, fieldId },
              },
              update: {
                workspaceId,
                value:
                  fieldType === "richtext"
                    ? sanitizeRichTextHtml(value)
                    : value,
              },
              create: {
                postId: id,
                fieldId,
                workspaceId,
                value:
                  fieldType === "richtext"
                    ? sanitizeRichTextHtml(value)
                    : value,
              },
            });
          })
        );
      }

      return updatedPost;
    });

    const eventType =
      post.status !== "published" && postUpdated.status === "published"
        ? "post_published"
        : post.status === "published" && postUpdated.status !== "published"
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

    // Invalidate cache for posts
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
  const sessionData = await getServerSession();

  const workspaceId = sessionData?.session.activeOrganizationId;
  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const activeWorkspaceId = sessionData.session.activeOrganizationId;

  try {
    const deletedPost = await db.post.delete({
      where: { id, workspaceId },
    });

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

    // Invalidate cache for posts
    invalidateCache(workspaceId, "posts");

    return NextResponse.json({ id: deletedPost.id }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
