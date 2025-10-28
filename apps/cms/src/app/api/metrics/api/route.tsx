import { format } from "date-fns";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { redis } from "@/lib/redis";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const lastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    )
      .toISOString()
      .slice(0, 7);

    const [totalStats, currentMonthRequests, lastMonthRequests] =
      await Promise.all([
        redis.hgetall(`analytics:workspace:${workspaceId}`),
        redis.hget(`analytics:workspace:${workspaceId}:monthly`, currentMonth),
        redis.hget(`analytics:workspace:${workspaceId}:monthly`, lastMonth),
      ]);

    const totalRequests = Number(totalStats?.pageViews || 0);
    const currentMonthCount = Number(currentMonthRequests || 0);
    const lastMonthCount = Number(lastMonthRequests || 0);

    const monthlyGrowth =
      lastMonthCount > 0
        ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100
        : currentMonthCount > 0
          ? 100
          : 0;

    const last12MonthsData: { month: string; requests: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = date.toISOString().slice(0, 7);
      const monthRequests = await redis.hget(
        `analytics:workspace:${workspaceId}:monthly`,
        monthKey
      );

      last12MonthsData.push({
        month: format(date, "MMM yy"),
        requests: Number(monthRequests || 0),
      });
    }

    return NextResponse.json({
      totalRequests,
      currentMonthRequests: currentMonthCount,
      lastMonthRequests: lastMonthCount,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      chartData: last12MonthsData,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
