import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
	const sessionData = await getServerSession();

	if (!sessionData) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const workspaces = await db.organization.findMany({
		where: {
			members: {
				some: {
					userId: sessionData.user.id,
				},
			},
		},
		select: {
			id: true,
			name: true,
			slug: true,
			logo: true,
			timezone: true,
			createdAt: true,
			members: {
				select: {
					id: true,
					role: true,
					organizationId: true,
					createdAt: true,
					userId: true,
					user: { select: { id: true, name: true, email: true, image: true } },
				},
			},
			invitations: {
				select: {
					id: true,
					email: true,
					role: true,
					status: true,
					organizationId: true,
					inviterId: true,
					expiresAt: true,
				},
			},
			subscription: {
				select: {
					id: true,
					status: true,
					plan: true,
					currentPeriodStart: true,
					currentPeriodEnd: true,
					cancelAtPeriodEnd: true,
					canceledAt: true,
				},
			},
			editorPreferences: {
				select: {
					ai: {
						select: {
							enabled: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const workspacesWithRole = workspaces.map((workspace) => {
		const currentUserMember = workspace.members.find(
			(member) => member.userId === sessionData.user.id,
		);
		return {
			...workspace,
			currentUserRole: currentUserMember?.role || null,
			ai: workspace.editorPreferences?.ai || { enabled: false },
		};
	});

	return NextResponse.json(workspacesWithRole);
}
