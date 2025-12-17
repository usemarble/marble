import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";

export async function GET() {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  const transformedCategories = categories.map((category) => {
    const { _count, ...rest } = category;
    return {
      ...rest,
      postsCount: _count.posts,
    };
  });

  return NextResponse.json(transformedCategories, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      workspaceId,
    },
  });

  dispatchWebhooks({
    workspaceId,
    validationEvent: "category_created",
    deliveryEvent: "category.created",
    payload: {
      id: categoryCreated.id,
      slug: categoryCreated.slug,
      userId: sessionData.user.id,
    },
  }).catch((error) => {
    console.error(
      `[WebhookDelivery] Failed to dispatch webhooks for category_created: workspaceId=${workspaceId}, categoryId=${categoryCreated.id},`,
      error
    );
  });

  return NextResponse.json(categoryCreated, { status: 201 });
}
