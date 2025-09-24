import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { authorSchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData?.user || !sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  if (!workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const authors = await db.author.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        slug: true,
        email: true,
        userId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(authors, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch authors:", error);
    return NextResponse.json(
      { error: "Failed to fetch authors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData?.user || !workspaceId) {
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

    const { name, bio, role, email, image, slug, userId } = parsedBody.data;

    const validEmail = email === "" ? null : email;

    const validUserId = userId ? userId : null;

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
        userId: validUserId,
      },
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}
