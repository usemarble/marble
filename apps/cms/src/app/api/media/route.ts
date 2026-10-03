import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { getDashboardMedia } from "@/lib/queries/dashboard/media";
import { loadMediaApiFilters } from "@/lib/search-params";

export async function GET(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const filters = loadMediaApiFilters(request, { strict: true });
  if (!z.number().int().min(1).safeParse(filters.page).success) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  if (!z.number().int().min(1).max(100).safeParse(filters.perPage).success) {
    return NextResponse.json({ error: "Invalid perPage" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getDashboardMedia(workspaceId, filters), {
      status: 200,
    });
  } catch (error) {
    console.error("[Media] Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
