import { db } from "@marble/db";
import { eachDayOfInterval, endOfYear, format, startOfYear } from "date-fns";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const now = new Date();
  const startOfCurrentYear = startOfYear(now);
  const endOfCurrentYear = endOfYear(now);

  const posts = await db.post.findMany({
    where: {
      workspaceId,
      status: "published",
      publishedAt: {
        gte: startOfCurrentYear,
        lte: endOfCurrentYear,
      },
    },
    select: {
      publishedAt: true,
    },
    orderBy: {
      publishedAt: "asc",
    },
  });

  const dateCountMap = new Map<string, number>();

  for (const post of posts) {
    if (post.publishedAt) {
      const dateKey = format(post.publishedAt, "yyyy-MM-dd");
      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
    }
  }

  const allDaysInYear = eachDayOfInterval({
    start: startOfCurrentYear,
    end: endOfCurrentYear,
  });

  const maxCount = Math.max(...Array.from(dateCountMap.values()), 1);

  const activityData = allDaysInYear.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const count = dateCountMap.get(dateKey) || 0;

    let level: number;
    const percentage = count === 0 ? 0 : (count / maxCount) * 100;

    if (count === 0) {
      level = 0;
    } else if (percentage <= 25) {
      level = 1;
    } else if (percentage <= 50) {
      level = 2;
    } else if (percentage <= 75) {
      level = 3;
    } else {
      level = 4;
    }

    return {
      date: dateKey,
      count,
      level,
    };
  });

  return NextResponse.json({
    graph: {
      activity: activityData,
    },
  });
}
