import { db } from "@marble/db";
import { NextResponse } from "next/server";

/**
 * Validates and deduplicates tag IDs for a specific workspace
 * @param tagIds - Array of tag IDs to validate
 * @param workspaceId - The workspace ID to scope validation to
 * @returns Object containing validated unique tag IDs or error response
 */
export async function validateWorkspaceTags(
  tagIds: string[] | undefined,
  workspaceId: string
): Promise<
  | { success: true; uniqueTagIds: string[] }
  | { success: false; response: NextResponse }
> {
  const uniqueTagIds = Array.from(new Set(tagIds ?? []));

  if (uniqueTagIds.length) {
    const valid = await db.tag.findMany({
      where: {
        id: { in: uniqueTagIds },
        workspaceId,
      },
      select: { id: true },
    });

    if (valid.length !== uniqueTagIds.length) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "One or more tags are invalid for this workspace." },
          { status: 400 }
        ),
      };
    }
  }

  return { success: true, uniqueTagIds };
}
