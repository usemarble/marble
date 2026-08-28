import { createRecordId, db } from "@marble/drizzle";
import {
  author as authorTable,
  authorSocial,
  subscription,
} from "@marble/drizzle/schema";
import { toAuthorPayload } from "@marble/events";
import { and, count, desc, eq, gt, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import { getWorkspacePlan, PLAN_LIMITS } from "@/lib/plans";
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
    const subscriptions = await db
      .select({
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      })
      .from(subscription)
      .where(
        and(
          eq(subscription.workspaceId, workspaceId),
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
            and(
              eq(subscription.status, "canceled"),
              eq(subscription.cancelAtPeriodEnd, true),
              gt(subscription.currentPeriodEnd, new Date())
            )
          )
        )
      )
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    const activeSubscription = subscriptions[0] || null;
    const currentPlan = getWorkspacePlan(activeSubscription);

    const planLimits = PLAN_LIMITS[currentPlan];
    if (planLimits.maxAuthors !== Number.MAX_SAFE_INTEGER) {
      const [authorsCount] = await db
        .select({ value: count() })
        .from(authorTable)
        .where(
          and(
            eq(authorTable.workspaceId, workspaceId),
            eq(authorTable.isActive, true)
          )
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

    const author = await db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        eq(authorTable.slug, slug)
      ),
    });

    if (author) {
      return NextResponse.json(
        { error: "Author with this name already exists" },
        { status: 409 }
      );
    }

    const createdAuthor = await db.transaction(async (tx) => {
      const [authorRow] = await tx
        .insert(authorTable)
        .values({
          id: createRecordId(),
          name,
          slug,
          bio,
          role,
          email: validEmail,
          image,
          workspaceId,
          updatedAt: new Date(),
        })
        .returning();

      if (!authorRow) {
        throw new Error("Failed to create author");
      }

      const socialRows =
        socials && socials.length > 0
          ? await tx
              .insert(authorSocial)
              .values(
                socials.map((social) => ({
                  id: createRecordId(),
                  authorId: authorRow.id,
                  url: social.url,
                  platform: social.platform,
                  updatedAt: new Date(),
                }))
              )
              .returning()
          : [];

      return { ...authorRow, socials: socialRows };
    });

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
