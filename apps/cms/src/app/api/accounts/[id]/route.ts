import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getServerSession();

	if (!session || !session.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	const deletedAccount = await db.account.delete({
		where: {
			id,
			userId: session.user.id,
		},
	});

	return NextResponse.json(deletedAccount.id, { status: 204 });
}
