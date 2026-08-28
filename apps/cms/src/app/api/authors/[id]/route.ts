import { createRecordId, db } from "@marble/drizzle";
import { author as authorTable, authorSocial } from "@marble/drizzle/schema";
import { toAuthorPayload, withChanges } from "@marble/events";

import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { authorSchema } from "@/lib/validations/authors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Author ID is required" },
      { status: 400 }
    );
  }

  try {
    const author = await db.query.author.findFirst({
      where: and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId)),
      with: {
        socials: true,
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const [deletedAuthor] = await db
      .delete(authorTable)
      .where(and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId)))
      .returning();

    if (!deletedAuthor) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    invalidateCache(workspaceId, "authors");
    invalidateCache(workspaceId, "posts");

    await emitDashboardEvent({
      type: "author_deleted",
      workspaceId,
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
  const accessData = await requireActiveWorkspaceAccess();
  const { id } = await params;

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  try {
    const body = await request.json();
    const parsedBody = authorSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { name, bio, role, email, image, slug, socials } = parsedBody.data;

    const validEmail = email === "" ? null : email;

    const author = await db.query.author.findFirst({
      where: and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId)),
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const authorWithSlug = await db.query.author.findFirst({
      where: and(
        eq(authorTable.slug, slug),
        eq(authorTable.workspaceId, workspaceId),
        ne(authorTable.id, id)
      ),
    });

    if (authorWithSlug) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 }
      );
    }

    const updatedAuthor = await db.transaction(async (tx) => {
      const [authorRow] = await tx
        .update(authorTable)
        .set({
          name,
          bio,
          role,
          email: validEmail,
          image,
          slug,
          updatedAt: new Date(),
        })
        .where(and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId)))
        .returning();

      if (!authorRow) {
        throw new Error("Author not found");
      }

      if (typeof socials !== "undefined") {
        await tx
          .delete(authorSocial)
          .where(eq(authorSocial.authorId, id));

        const socialRows =
          socials.length > 0
            ? await tx
                .insert(authorSocial)
                .values(
                  socials.map((social) => ({
                    id: createRecordId(),
                    authorId: id,
                    url: social.url,
                    platform: social.platform,
                    updatedAt: new Date(),
                  }))
                )
                .returning()
            : [];

        return { ...authorRow, socials: socialRows };
      }

      const socialRows = await tx
        .select()
        .from(authorSocial)
        .where(eq(authorSocial.authorId, id));

      return { ...authorRow, socials: socialRows };
    });

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
