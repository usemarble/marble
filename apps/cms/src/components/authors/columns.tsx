"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { Author } from "@/types/author";
import { AuthorTableActions } from "./table-actions";

export const columns: ColumnDef<Author>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => {
			const author = row.original;
			const avatarFallback = author.name?.charAt(0).toUpperCase() || "?";

			return (
				<div className="flex items-center gap-3">
					<Avatar className="size-8">
						<AvatarImage src={author.image || undefined} />
						<AvatarFallback>{avatarFallback}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-medium text-sm">{author.name}</span>
						{/* {author.email && (
              <span className="text-xs text-muted-foreground">
                {author.email}
              </span>
            )} */}
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "isActive",
		header: "Status",
		cell: ({ row }) => {
			const author = row.original;

			return (
				<Badge variant={author.isActive ? "positive" : "negative"}>
					{author.isActive ? "Active" : "Inactive"}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		header: () => <div className="flex justify-end pr-10">Actions</div>,
		cell: ({ row }) => {
			return (
				<div className="flex justify-end pr-10">
					<AuthorTableActions author={row.original} />
				</div>
			);
		},
	},
];
