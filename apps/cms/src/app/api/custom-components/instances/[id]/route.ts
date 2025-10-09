import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";

const componentInstanceUpdateSchema = z.object({
  data: z.record(z.unknown()),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const instance = await db.componentInstance.findUnique({
      where: { id },
      include: {
        customComponent: {
          include: {
            properties: true,
          },
        },
        post: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Component instance not found" },
        { status: 404 }
      );
    }

    if (
      instance.post.workspaceId !== sessionData.session.activeOrganizationId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(instance, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to fetch component instance" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsedBody = componentInstanceUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error },
      { status: 400 }
    );
  }

  const { data } = parsedBody.data;

  try {
    const existingInstance = await db.componentInstance.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!existingInstance) {
      return NextResponse.json(
        { error: "Component instance not found" },
        { status: 404 }
      );
    }

    if (
      existingInstance.post.workspaceId !==
      sessionData.session.activeOrganizationId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const instance = await db.componentInstance.update({
      where: { id },
      data: { data },
      include: {
        customComponent: {
          include: {
            properties: true,
          },
        },
      },
    });

    return NextResponse.json(instance, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to update component instance" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingInstance = await db.componentInstance.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!existingInstance) {
      return NextResponse.json(
        { error: "Component instance not found" },
        { status: 404 }
      );
    }

    if (
      existingInstance.post.workspaceId !==
      sessionData.session.activeOrganizationId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.componentInstance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete component instance" },
      { status: 500 }
    );
  }
}
