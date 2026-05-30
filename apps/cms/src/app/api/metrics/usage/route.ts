import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { getDashboardUsageMetrics } from "@/lib/queries/dashboard/usage";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  return NextResponse.json(
    await getDashboardUsageMetrics(accessData.workspaceId)
  );
}
