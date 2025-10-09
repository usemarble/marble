import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";

const componentInstanceSchema = z.object({
  postId: z.string(),
  customComponentId: z.string(),
  data: z.record(z.unknown()),
});

export async function GET(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const post = await db.post.findFirst({
      where: {
        id: postId,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const instances = await db.componentInstance.findMany({
      where: { postId },
      include: {
        customComponent: {
          include: {
            properties: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(instances, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to fetch component instances" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = componentInstanceSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error },
      { status: 400 }
    );
  }

  const { postId, customComponentId, data } = parsedBody.data;

  try {
    const post = await db.post.findFirst({
      where: {
        id: postId,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const customComponent = await db.customComponent.findFirst({
      where: {
        id: customComponentId,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    if (!customComponent) {
      return NextResponse.json(
        { error: "Custom component not found" },
        { status: 404 }
      );
    }

    const instance = await db.componentInstance.create({
      data: {
        postId,
        customComponentId,
        data,
      },
      include: {
        customComponent: {
          include: {
            properties: true,
          },
        },
      },
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to create component instance" },
      { status: 500 }
    );
  }
}
