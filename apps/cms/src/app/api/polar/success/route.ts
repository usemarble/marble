import { db } from "@marble/drizzle";
import { workspace } from "@marble/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get("checkout_id");

  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL));
  }

  console.log("Checkout ID", checkoutId);

  const { workspaceId } = accessData;

  const foundWorkspace = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: { slug: true },
  });

  invalidateCache(workspaceId, "usage");

  if (foundWorkspace) {
    return NextResponse.redirect(
      new URL(
        `/${foundWorkspace.slug}/settings/billing?success=true`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL));
}
