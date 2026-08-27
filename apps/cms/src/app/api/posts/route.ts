import { db } from "@marble/drizzle";
import type { TransactionClient } from "@marble/drizzle";
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
import { toPostPayload } from "@marble/events";
import { sanitizeHtml, sanitizeRichTextHtml } from "@marble/utils/sanitize";
import { createRecordId } from "@marble/drizzle/create-id";
import { and, asc, eq, inArray } from "@marble/drizzle/operators";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { resolveCustomFieldValues } from "@/lib/custom-fields";
import { getDashboardPosts } from "@/lib/queries/dashboard/posts";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { loadPostApiFilters } from "@/lib/search-params";
import { postUpsertSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { generateSlug } from "@/utils/string";

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

  const normalizedInput: Record<string, string | null | undefined> = {
    ...input,
  };
  for (const fieldRow of fields) {
    if (!(fieldRow.id in normalizedInput)) {
      normalizedInput[fieldRow.id] = undefined;
    }
  }

  return resolveCustomFieldValues(fields, normalizedInput);
}

async function writeCustomFieldValues(
  tx: TransactionClient,
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
            workspaceId,
            value: storedValue,
            updatedAt: now,
          },
        });
    })
  );
}

export async function GET(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const filters = loadPostApiFilters(request, { strict: true });
  if (!z.number().int().min(1).safeParse(filters.page).success) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  if (!z.number().int().min(1).max(100).safeParse(filters.perPage).success) {
    return NextResponse.json({ error: "Invalid perPage" }, { status: 400 });
  }

  return NextResponse.json(await getDashboardPosts(workspaceId, filters));
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid JSON",
        details: error instanceof Error ? error.message : "",
      },
      { status: 400 }
    );
  }

  const values = postUpsertSchema.safeParse(body);
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const existingPost = await db.query.post.findFirst({
    where: and(
      eq(post.slug, values.data.slug),
      eq(post.workspaceId, workspaceId)
    ),
  });

  if (existingPost) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  let primaryAuthor = await db.query.author.findFirst({
    where: and(
      eq(author.workspaceId, workspaceId),
      eq(author.userId, sessionData.user.id)
    ),
  });

  if (!primaryAuthor) {
    primaryAuthor = await db.query.author.findFirst({
      where: eq(author.workspaceId, workspaceId),
      orderBy: asc(author.createdAt),
    });
  }

  if (!primaryAuthor) {
    try {
      const baseSlug = generateSlug(sessionData.user.name || "user");
      const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
      const now = new Date();

      const [createdAuthor] = await db
        .insert(author)
        .values({
          id: createRecordId(),
          name: sessionData.user.name || "Member",
          email: sessionData.user.email,
          slug: uniqueSlug,
          image: sessionData.user.image,
          workspaceId,
          userId: sessionData.user.id,
          role: "Writer",
          updatedAt: now,
        })
        .returning();

      primaryAuthor = createdAuthor;
    } catch (error) {
      console.error("[PostCreate] Failed to generate fallback author:", error);
      return NextResponse.json(
        { error: "Failed to create author profile for post" },
        { status: 500 }
      );
    }
  }

  if (!primaryAuthor) {
    return NextResponse.json(
      { error: "Failed to create author profile for post" },
      { status: 500 }
    );
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

  const authorIds = values.data.authors || [primaryAuthor.id];
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

  try {
    const postCreated = await db.transaction(async (tx) => {
      const postId = createRecordId();
      const now = new Date();

      const [createdPost] = await tx
        .insert(post)
        .values({
          id: postId,
          primaryAuthorId: primaryAuthor.id,
          contentJson,
          slug: values.data.slug,
          title: values.data.title,
          status: values.data.status,
          featured: values.data.featured,
          content: cleanContent,
          categoryId: values.data.category,
          coverImage: values.data.coverImage,
          publishedAt: values.data.publishedAt,
          description: values.data.description,
          workspaceId,
          updatedAt: now,
        })
        .returning();

      if (!createdPost) {
        throw new Error("Failed to create post");
      }

      if (uniqueTagIds.length > 0) {
        await tx.insert(postToTag).values(
          uniqueTagIds.map((tagId) => ({
            a: createdPost.id,
            b: tagId,
          }))
        );
      }

      await tx.insert(postToAuthor).values(
        validAuthors.map((authorRow) => ({
          a: authorRow.id,
          b: createdPost.id,
        }))
      );

      const customFieldWrites = await buildCustomFieldWrites(
        workspaceId,
        values.data.customFields
      );

      if (!customFieldWrites.success) {
        throw new Error(JSON.stringify(customFieldWrites.error));
      }

      await writeCustomFieldValues(
        tx,
        workspaceId,
        createdPost.id,
        customFieldWrites
      );

      return createdPost;
    });

    await emitDashboardEvent({
      type:
        postCreated.status === "published" ? "post_published" : "post_created",
      workspaceId,
      resourceType: "post",
      resourceId: postCreated.id,
      actorId: sessionData.user.id,
      payload: toPostPayload(postCreated),
    }).catch(logDashboardEventError);

    invalidateCache(workspaceId, "posts");

    return NextResponse.json({ id: postCreated.id });
  } catch (error) {
    if (error instanceof Error) {
      try {
        const customFieldError = JSON.parse(error.message);
        if (customFieldError?.error) {
          return NextResponse.json(customFieldError, { status: 400 });
        }
      } catch {
        // Ignore
      }
    }
    console.error("[PostCreate] Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
