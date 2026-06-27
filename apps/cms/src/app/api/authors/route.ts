import { db } from "@marble/db";
import { toAuthorPayload } from "@marble/events";
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
    // Check plan limits before creating another author.
    const workspace = await db.organization.findUnique({
      where: { id: workspaceId },
      select: {
        subscriptions: {
          where: {
            OR: [
              { status: "active" },
              { status: "trialing" },
              {
                status: "canceled",
                cancelAtPeriodEnd: true,
                currentPeriodEnd: { gt: new Date() },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
          },
        },
      },
    });

    const activeSubscription = workspace?.subscriptions[0] || null;
    const currentPlan = getWorkspacePlan(activeSubscription);

    const planLimits = PLAN_LIMITS[currentPlan];
    if (planLimits.maxAuthors !== Number.MAX_SAFE_INTEGER) {
      const existingAuthorsCount = await db.author.count({
        where: {
          workspaceId,
          isActive: true,
        },
      });

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

    // const slug = generateSlug(name);

    const existingAuthor = await db.author.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
    });

    if (existingAuthor) {
      return NextResponse.json(
        { error: "Author with this name already exists" },
        { status: 409 }
      );
    }

    const author = await db.author.create({
      data: {
        name,
        slug,
        bio,
        role,
        email: validEmail,
        image,
        workspaceId,
        ...(socials &&
          socials.length > 0 && {
            socials: {
              create: socials.map((social) => ({
                url: social.url,
                platform: social.platform,
              })),
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
      type: "author_created",
      workspaceId,
      resourceType: "author",
      resourceId: author.id,
      actorId: sessionData.user.id,
      payload: toAuthorPayload(author),
    }).catch(logDashboardEventError);

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}
