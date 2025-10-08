import { db } from "@marble/db";
import { PostStatus, type Prisma } from "@prisma/client";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { generateSlug } from "@/utils/string";

function toMinimalDoc(content: string): Prisma.InputJsonValue {
  const hasText = Boolean(content && content.trim().length > 0);
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: hasText ? [{ type: "text", text: content }] : [],
      },
    ],
  } as unknown as Prisma.InputJsonValue;
}

async function resolveOrCreateCategory(slug: string, workspaceId: string) {
  let category = await db.category.findFirst({
    where: { slug, workspaceId },
  });
  if (!category) {
    category = await db.category.create({
      data: { name: slug, slug, workspaceId },
    });
  }
  return category;
}

async function resolveOrCreateTags(slugs: string[], workspaceId: string) {
  const tagConnect = [] as { id: string }[];
  for (const slug of slugs) {
    let tag = await db.tag.findFirst({
      where: { slug, workspaceId },
      select: { id: true },
    });
    if (!tag) {
      tag = await db.tag.create({
        data: { name: slug, slug, workspaceId },
        select: { id: true },
      });
    }
    tagConnect.push({ id: tag.id });
  }
  return tagConnect;
}

async function createPost(data: {
  title: string;
  slug: string;
  description: string;
  status: PostStatus;
  publishedAt: Date;
  content: string;
  contentJson: Prisma.InputJsonValue;
  categoryId: string;
  workspaceId: string;
  primaryAuthorId: string;
  tags?: { id: string }[];
}) {
  try {
    await db.post.create({
      data: {
        ...data,
        authors: { connect: [{ id: data.primaryAuthorId }] },
        tags: data.tags?.length ? { connect: data.tags } : undefined,
      },
    });
    return true;
  } catch (error) {
    console.warn("Failed to create post:", error);
    return false;
  }
}

async function processJsonContent(
  file: File,
  raw: string,
  workspaceId: string,
  primaryAuthorId: string
) {
  let created = 0;
  try {
    const parsedJson = JSON.parse(raw);
    const items = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
    for (const item of items) {
      const it = (item ?? {}) as Record<string, unknown>;
      const title =
        typeof it.title === "string"
          ? it.title
          : file.name.replace(/\.(json)$/i, "");
      const slug = typeof it.slug === "string" ? it.slug : generateSlug(title);
      const description =
        typeof it.description === "string" ? it.description : "";
      const status: PostStatus =
        typeof it.status === "string" && it.status === "published"
          ? PostStatus.published
          : PostStatus.draft;
      const publishedAt = new Date(
        typeof it.publishedAt === "string" || typeof it.publishedAt === "number"
          ? (it.publishedAt as string | number)
          : Date.now()
      );
      const categorySlug =
        typeof it.category === "string" ? it.category : "uncategorized";
      const tags = Array.isArray(it.tags)
        ? (it.tags as unknown[]).filter(
            (t): t is string => typeof t === "string"
          )
        : [];

      const content =
        typeof it.contentHtml === "string"
          ? it.contentHtml
          : typeof it.content === "string"
            ? it.content
            : "";
      const jsonValue: Prisma.InputJsonValue =
        typeof it.contentJson !== "undefined"
          ? (it.contentJson as Prisma.InputJsonValue)
          : toMinimalDoc(content);

      const category = await resolveOrCreateCategory(categorySlug, workspaceId);
      const tagConnect = await resolveOrCreateTags(tags, workspaceId);

      const success = await createPost({
        title,
        slug,
        description,
        status,
        publishedAt,
        content,
        contentJson: jsonValue,
        categoryId: category.id,
        workspaceId,
        primaryAuthorId,
        tags: tagConnect,
      });

      if (success) {
        created++;
      }
    }
  } catch (error) {
    console.warn("Failed to process JSON content:", error);
  }
  return created;
}

async function processMarkdownContent(
  file: File,
  raw: string,
  workspaceId: string,
  primaryAuthorId: string
) {
  try {
    const parsed = matter(raw);
    const fm = (parsed.data ?? {}) as Record<string, unknown>;
    const content = parsed.content || "";

    const title =
      typeof fm.title === "string"
        ? fm.title
        : file.name.replace(/\.(md|mdx)$/i, "");
    const description =
      typeof fm.description === "string" ? fm.description : "";
    const slug = typeof fm.slug === "string" ? fm.slug : generateSlug(title);
    const status: PostStatus =
      typeof fm.status === "string" && fm.status === "published"
        ? PostStatus.published
        : PostStatus.draft;
    const publishedAt = new Date(
      typeof fm.publishedAt === "string" || typeof fm.publishedAt === "number"
        ? (fm.publishedAt as string | number)
        : Date.now()
    );
    const categorySlug =
      typeof fm.category === "string" ? fm.category : "uncategorized";
    const tagSlugs = Array.isArray(fm.tags)
      ? (fm.tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [];

    const contentJson: Prisma.InputJsonValue = toMinimalDoc(content);

    const category = await resolveOrCreateCategory(categorySlug, workspaceId);
    const tagConnect = await resolveOrCreateTags(tagSlugs, workspaceId);

    const success = await createPost({
      title,
      slug,
      description,
      status,
      publishedAt,
      content,
      contentJson,
      categoryId: category.id,
      workspaceId,
      primaryAuthorId,
      tags: tagConnect,
    });

    return success ? 1 : 0;
  } catch (error) {
    console.warn("Failed to process Markdown content:", error);
    return 0;
  }
}

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Ensure primary author exists (mirrors /api/posts)
  const baseSlug = generateSlug(sessionData.user.name);
  const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
  const primaryAuthor = await db.author.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId: sessionData.user.id },
    },
    update: {},
    create: {
      name: sessionData.user.name,
      email: sessionData.user.email,
      slug: uniqueSlug,
      image: sessionData.user.image,
      workspaceId,
      userId: sessionData.user.id,
      role: "Writer",
    },
  });

  let created = 0;
  for (const file of files) {
    if (!(file instanceof File)) {
      continue;
    }
    const raw = await file.text();
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (ext === "json") {
      created += await processJsonContent(
        file,
        raw,
        workspaceId,
        primaryAuthor.id
      );
    } else if (ext === "md" || ext === "mdx") {
      created += await processMarkdownContent(
        file,
        raw,
        workspaceId,
        primaryAuthor.id
      );
    }
  }

  return NextResponse.json({ created });
}
