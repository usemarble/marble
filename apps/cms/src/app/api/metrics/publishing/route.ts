import { db } from "@marble/drizzle";
import { post } from "@marble/drizzle/schema";
import { eachDayOfInterval, endOfYear, format, startOfYear } from "date-fns";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const now = new Date();
  const startOfCurrentYear = startOfYear(now);
  const endOfCurrentYear = endOfYear(now);

  const posts = await db
    .select({ publishedAt: post.publishedAt })
    .from(post)
    .where(
      and(
        eq(post.workspaceId, workspaceId),
        eq(post.status, "published"),
        gte(post.publishedAt, startOfCurrentYear),
        lte(post.publishedAt, endOfCurrentYear)
      )
    )
    .orderBy(asc(post.publishedAt));

  const dateCountMap = new Map<string, number>();

  for (const entry of posts) {
    if (entry.publishedAt) {
      const dateKey = format(entry.publishedAt, "yyyy-MM-dd");
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
