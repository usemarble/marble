import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  type CustomFieldValidationDefinition,
  resolveCustomFieldValues,
} from "@/lib/custom-fields";
import { type Attribution, postUpsertSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
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

  const fields = await db.customField.findMany({
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
      attribution: true,
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
    attribution: post.attribution as Attribution,
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
  const validAttribution = values.data.attribution
    ? values.data.attribution
    : undefined;
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
          attribution: validAttribution,
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
              return tx.postFieldValue.deleteMany({
                where: {
                  postId: id,
                  fieldId,
                  workspaceId,
                },
              });
            }

            return tx.postFieldValue.upsert({
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

    const data = {
      id: postUpdated.id,
      title: postUpdated.title,
      slug: postUpdated.slug,
      userId: sessionData.user.id,
    };

    // Fire and forget - don't block response
    if (values.data.status === "published" && post.status === "draft") {
      dispatchWebhooks({
        workspaceId,
        validationEvent: "post_published",
        deliveryEvent: "post.published",
        payload: data,
      }).catch((error) => {
        console.error(
          `[PostPublish] Failed to dispatch webhooks: postId=${postUpdated.id}`,
          error
        );
      });
    }

    dispatchWebhooks({
      workspaceId,
      validationEvent: "post_updated",
      deliveryEvent: "post.updated",
      payload: data,
    }).catch((error) => {
      console.error(
        `[PostUpdate] Failed to dispatch webhooks: postId=${postUpdated.id}`,
        error
      );
    });

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

    // Fire and forget - don't block response
    dispatchWebhooks({
      workspaceId,
      validationEvent: "post_deleted",
      deliveryEvent: "post.deleted",
      payload: { id, slug: deletedPost.slug, userId: sessionData.user.id },
    }).catch((error) => {
      console.error(
        `[PostDelete] Failed to dispatch webhooks: postId=${id}`,
        error
      );
    });

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
