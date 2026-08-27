import { db } from "@marble/drizzle";
import { tag } from "@marble/drizzle/schema";
import { toTagPayload } from "@marble/events";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { getDashboardTags } from "@/lib/queries/dashboard/taxonomy";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { tagSchema } from "@/lib/validations/workspace";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  return NextResponse.json(await getDashboardTags(workspaceId), {
    status: 200,
  });
}

export async function POST(req: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const json = await req.json();
  const body = tagSchema.parse(json);

  const existingTag = await db.query.tag.findFirst({
    where: and(eq(tag.slug, body.slug), eq(tag.workspaceId, workspaceId)),
  });

  if (existingTag) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const [tagCreated] = await db
    .insert(tag)
    .values({
      id: createId(),
      name: body.name,
      slug: body.slug,
      description: body.description,
      workspaceId,
      updatedAt: new Date(),
    })
    .returning();

  if (!tagCreated) {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }

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
