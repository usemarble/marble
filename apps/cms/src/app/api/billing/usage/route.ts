import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
	const sessionData = await getServerSession();

	if (!sessionData) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const workspaceId = sessionData.session?.activeOrganizationId;

	if (!workspaceId) {
		return NextResponse.json(
			{ error: "Active workspace not found in session" },
			{ status: 400 },
		);
	}

	const totalMediaSize = await db.media.aggregate({
		where: { workspaceId },
		_sum: {
			size: true,
		},
	});

	return NextResponse.json(
		{ media: totalMediaSize._sum.size ?? 0 },
		{ status: 200 },
	);
}
