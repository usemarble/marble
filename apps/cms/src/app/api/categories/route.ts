import { db } from "@marble/db";
import { toCategoryPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { getDashboardCategories } from "@/lib/queries/dashboard/taxonomy";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { categorySchema } from "@/lib/validations/workspace";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  return NextResponse.json(await getDashboardCategories(workspaceId), {
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
  const body = categorySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const existingCategory = await db.category.findFirst({
    where: {
      slug: body.data.slug,
      workspaceId,
    },
  });

  if (existingCategory) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const categoryCreated = await db.category.create({
    data: {
      name: body.data.name,
      slug: body.data.slug,
      description: body.data.description,
      workspaceId,
    },
  });

  await emitDashboardEvent({
    type: "category_created",
    workspaceId,
    resourceType: "category",
    resourceId: categoryCreated.id,
    actorId: sessionData.user.id,
    payload: toCategoryPayload(categoryCreated),
  }).catch(logDashboardEventError);

  // Invalidate cache for categories and posts (categories affect posts)
  invalidateCache(workspaceId, "categories");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(categoryCreated, { status: 201 });
}
