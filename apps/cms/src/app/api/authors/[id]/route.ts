import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { authorSchema } from "@/lib/validations/workspace";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData?.user || !sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Author ID is required" },
      { status: 400 },
    );
  }

  try {
    const author = await db.author.findUnique({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
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

    return NextResponse.json(deletedAuthor.id, { status: 200 });
  } catch (error) {
    console.error("Failed to delete author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 400 },
      );
    }

    const { name, bio, role, email, image, userId } = parsedBody.data;

    const validEmail = email === "" ? null : email;
    const validUserId = userId ? userId : null;

    const author = await db.author.findUnique({
      where: {
        id,
        workspaceId: workspaceId,
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const updatedAuthor = await db.author.update({
      where: {
        id,
        workspaceId: workspaceId,
      },
      data: {
        name,
        bio,
        role,
        email: validEmail,
        image,
        userId: validUserId,
      },
    });

    return NextResponse.json(updatedAuthor, { status: 200 });
  } catch (error) {
    console.error("Failed to update author:", error);
    return NextResponse.json(
      { error: "Failed to update author" },
      { status: 500 },
    );
  }
}
