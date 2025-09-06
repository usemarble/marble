import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.session.activeOrganizationId;
  // Ensure user is requesting authors for their active workspace
  if (!workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const authors = await db.author.findMany({
      where: {
        workspaceId: workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        email: true,
        userId: true,
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
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, bio, role, email, image } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Check if slug already exists
    const existingAuthor = await db.author.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: session.session.activeOrganizationId,
          slug,
        },
      },
    });

    if (existingAuthor) {
      return NextResponse.json(
        { error: "Author with this name already exists" },
        { status: 409 },
      );
    }

    const author = await db.author.create({
      data: {
        name,
        slug,
        bio,
        role,
        email,
        image,
        workspaceId: session.session.activeOrganizationId,
        userId: null,
      },
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 },
    );
  }
}
