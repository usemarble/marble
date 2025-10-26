"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

type UserRole = "owner" | "admin" | "member";

export type TeamMemberRow = {
	id: string;
	type: "member";
	name: string | null;
	email: string;
	image: string | null;
	role: UserRole;
	status: "accepted";
	userId?: string | null;
	joinedAt?: Date | null;
};

export const columns: ColumnDef<TeamMemberRow>[] = [
	{
		accessorKey: "name",
		header: "User",
		cell: ({ row }) => {
			const item = row.original;
			const displayName = item.name || item.email;
			const avatarFallback = displayName?.charAt(0).toUpperCase() || "?";

			return (
				<div className="flex items-center gap-3">
					<Avatar className="size-8">
						<AvatarImage src={item.image || undefined} />
						<AvatarFallback>{avatarFallback}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-medium text-sm">{displayName}</span>
						<span className="text-muted-foreground text-xs">{item.email}</span>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => {
			const item = row.original;

			return (
				<Badge className="capitalize" variant="outline">
					{item.role}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		header: () => <div className="flex justify-end pr-10">Actions</div>,
		cell: ({ row, table }) => {
			const meta = table.options.meta as {
				currentUserRole: UserRole | undefined;
				currentUserId: string | undefined;
			};
			return (
				<div className="flex justify-end pr-10">
					<TableActions
						{...row.original}
						currentUserId={meta?.currentUserId}
						currentUserRole={meta?.currentUserRole}
					/>
				</div>
			);
		},
	},
];
