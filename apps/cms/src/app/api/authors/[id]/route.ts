import { db } from "@marble/db";
import { toAuthorPayload, withChanges } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { emitDashboardEvent, logDashboardEventError } from "@/lib/events/fire";
import { authorSchema } from "@/lib/validations/authors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData?.user || !sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Author ID is required" },
      { status: 400 }
    );
  }

  try {
    const author = await db.author.findFirst({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
      include: {
        socials: true,
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const deletedAuthor = await db.author.delete({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    // Invalidate cache for authors and posts (authors affect posts)
    invalidateCache(sessionData.session.activeOrganizationId, "authors");
    invalidateCache(sessionData.session.activeOrganizationId, "posts");

    await emitDashboardEvent({
      type: "author_deleted",
      workspaceId: sessionData.session.activeOrganizationId,
      resourceType: "author",
      resourceId: author.id,
      actorId: sessionData.user.id,
      payload: toAuthorPayload(author),
    }).catch(logDashboardEventError);

    return NextResponse.json(deletedAuthor.id, { status: 200 });
  } catch (error) {
    console.error("Failed to delete author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = authorSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { name, bio, role, email, image, userId, slug, socials } =
      parsedBody.data;

    const validEmail = email === "" ? null : email;
    const validUserId = userId ? userId : null;

    const author = await db.author.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const existingAuthorWithSlug = await db.author.findFirst({
      where: {
        slug,
        workspaceId,
        id: { not: id },
      },
    });

    if (existingAuthorWithSlug) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 }
      );
    }

    const updatedAuthor = await db.author.update({
      where: {
        id,
        workspaceId,
      },
      data: {
        name,
        bio,
        role,
        email: validEmail,
        image,
        slug,
        userId: validUserId,
        ...(typeof socials !== "undefined" && {
          socials: {
            deleteMany: {},
            ...(socials.length > 0 && {
              create: socials.map((social) => ({
                url: social.url,
                platform: social.platform,
              })),
            }),
          },
        }),
      },
      include: {
        socials: true,
      },
    });

    // Invalidate cache for authors and posts (authors affect posts)
    invalidateCache(workspaceId, "authors");
    invalidateCache(workspaceId, "posts");

    await emitDashboardEvent({
      type: "author_updated",
      workspaceId,
      resourceType: "author",
      resourceId: updatedAuthor.id,
      actorId: sessionData.user.id,
      payload: withChanges(
        toAuthorPayload(updatedAuthor),
        Object.keys(parsedBody.data)
      ),
    }).catch(logDashboardEventError);

    return NextResponse.json(updatedAuthor, { status: 200 });
  } catch (error) {
    console.error("Failed to update author:", error);
    return NextResponse.json(
      { error: "Failed to update author" },
      { status: 500 }
    );
  }
}
