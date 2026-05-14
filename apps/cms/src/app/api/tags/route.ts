import { db } from "@marble/db";
import { toTagPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { emitDashboardEvent, logDashboardEventError } from "@/lib/events/fire";
import { tagSchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tags = await db.tag.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  const transformedTags = tags.map((tag) => {
    const { _count, ...rest } = tag;
    return {
      ...rest,
      postsCount: _count.posts,
    };
  });

  return NextResponse.json(transformedTags, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = tagSchema.parse(json);

  const existingTag = await db.tag.findFirst({
    where: {
      slug: body.slug,
      workspaceId,
    },
  });

  if (existingTag) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const tagCreated = await db.tag.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      workspaceId,
    },
  });

  await emitDashboardEvent({
    type: "tag_created",
    workspaceId,
    resourceType: "tag",
    resourceId: tagCreated.id,
    actorId: sessionData.user.id,
    payload: toTagPayload(tagCreated),
  }).catch(logDashboardEventError);

  // Invalidate cache for tags and posts (tags affect posts)
  invalidateCache(workspaceId, "tags");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(tagCreated, { status: 201 });
}
