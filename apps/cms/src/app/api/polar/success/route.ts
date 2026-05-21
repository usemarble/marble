import { db } from "@marble/db";
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

  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: { slug: true },
  });

  invalidateCache(workspaceId, "usage");

  if (workspace) {
    return NextResponse.redirect(
      new URL(
        `/${workspace.slug}/settings/billing?success=true`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL));
}
