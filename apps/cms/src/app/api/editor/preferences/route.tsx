import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET(_request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const editorPreferences = await db.editorPreferences.findUnique({
    where: { workspaceId: sessionData.session.activeOrganizationId },
    select: {
      workspaceId: true,
      ai: {
        select: {
          enabled: true,
        },
      },
    },
  });

  if (!editorPreferences) {
    return NextResponse.json(
      { error: "Editor preferences not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(editorPreferences, { status: 200 });
}

export async function PATCH(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspacePreferences = await db.post.findFirst({
    where: { workspaceId: sessionData.session.activeOrganizationId },
  });

  if (!workspacePreferences) {
    return NextResponse.json(
      { error: "No workspace preferences found" },
      { status: 404 }
    );
  }

  const { editorPreferenceSchema } = await import("@/lib/validations/editor");

  const body = await request.json();

  const parsedBody = editorPreferenceSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const updatedPreferences = await db.editorPreferences.update({
    where: { workspaceId: sessionData.session.activeOrganizationId },
    data: {
      ai: {
        update: {
          enabled: parsedBody.data.ai.enabled,
        },
      },
    },
  });

  return NextResponse.json(updatedPreferences, { status: 200 });
}
