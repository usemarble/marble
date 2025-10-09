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

  return NextResponse.json(
    editorPreferences ?? {
      workspaceId: sessionData.session.activeOrganizationId,
      ai: { enabled: false },
    },
    { status: 200 }
  );
}

export async function PATCH(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  const updatedPreferences = await db.editorPreferences.upsert({
    where: { workspaceId: sessionData.session.activeOrganizationId },
    create: {
      workspaceId: sessionData.session.activeOrganizationId,
      ai: {
        create: {
          enabled: parsedBody.data.ai.enabled,
        },
      },
    },
    update: {
      ai: {
        upsert: {
          create: {
            enabled: parsedBody.data.ai.enabled,
          },
          update: {
            enabled: parsedBody.data.ai.enabled,
          },
        },
      },
    },
    select: {
      workspaceId: true,
      ai: {
        select: {
          enabled: true,
        },
      },
    },
  });

  return NextResponse.json(updatedPreferences, { status: 200 });
}
