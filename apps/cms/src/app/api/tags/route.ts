import { db } from "@marble/db";
import { toTagPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/events/dispatch";
import { getDashboardTags } from "@/lib/queries/dashboard/taxonomy";
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
