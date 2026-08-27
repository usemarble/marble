import { db } from "@marble/drizzle";
import { author, authorSocial } from "@marble/drizzle/schema";
import { toAuthorPayload } from "@marble/events";
import { createRecordId } from "@marble/drizzle/create-id";
import { and, count, eq } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { getWorkspacePlan, PLAN_LIMITS } from "@/lib/plans";
import { findActiveWorkspaceSubscription } from "@/lib/subscription/active-subscription";
import { getDashboardAuthors } from "@/lib/queries/dashboard/authors";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { authorSchema } from "@/lib/validations/authors";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  try {
    return NextResponse.json(await getDashboardAuthors(workspaceId), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to fetch authors:", error);
    return NextResponse.json(
      { error: "Failed to fetch authors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  try {
    const activeSubscription = await findActiveWorkspaceSubscription(workspaceId);
    const currentPlan = getWorkspacePlan(activeSubscription);

    const planLimits = PLAN_LIMITS[currentPlan];
    if (planLimits.maxAuthors !== Number.MAX_SAFE_INTEGER) {
      const [authorsCount] = await db
        .select({ value: count() })
        .from(author)
        .where(
          and(eq(author.workspaceId, workspaceId), eq(author.isActive, true))
        );

      const existingAuthorsCount = authorsCount?.value ?? 0;

      if (existingAuthorsCount >= planLimits.maxAuthors) {
        return NextResponse.json(
          {
            error: `Author limit reached. Your current plan allows ${planLimits.maxAuthors} author${planLimits.maxAuthors === 1 ? "" : "s"}.`,
          },
          { status: 403 }
        );
      }
    }

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

    const existingAuthor = await db.query.author.findFirst({
      where: and(eq(author.workspaceId, workspaceId), eq(author.slug, slug)),
    });

    if (existingAuthor) {
      return NextResponse.json(
        { error: "Author with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const authorId = createRecordId();

    const createdAuthor = await db.transaction(async (tx) => {
      const [authorRow] = await tx
        .insert(author)
        .values({
          id: authorId,
          name,
          slug,
          bio,
          role,
          email: validEmail,
          image,
          workspaceId,
          updatedAt: now,
        })
        .returning();

      if (!authorRow) {
        throw new Error("Failed to create author");
      }

      let socialRows: (typeof authorSocial.$inferSelect)[] = [];

      if (socials && socials.length > 0) {
        socialRows = await tx
          .insert(authorSocial)
          .values(
            socials.map((social) => ({
              id: createRecordId(),
              authorId,
              url: social.url,
              platform: social.platform,
              updatedAt: now,
            }))
          )
          .returning();
      }

      return { ...authorRow, socials: socialRows };
    });

    // Invalidate cache for authors and posts (authors affect posts)
    invalidateCache(workspaceId, "authors");
    invalidateCache(workspaceId, "posts");

    await emitDashboardEvent({
      type: "author_created",
      workspaceId,
      resourceType: "author",
      resourceId: createdAuthor.id,
      actorId: sessionData.user.id,
      payload: toAuthorPayload(createdAuthor),
    }).catch(logDashboardEventError);

    return NextResponse.json(createdAuthor, { status: 201 });
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}
