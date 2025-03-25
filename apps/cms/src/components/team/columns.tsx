"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import TableActions from "./table-actions";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "canceled";
};

export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={member.image ?? undefined} />
            <AvatarFallback>
              {member.name?.charAt(0) ?? member.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{member.name || member.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      return <p className="text-muted-foreground">{role}</p>;
    },
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const status = row.original.status;
  //     return (
  //       <Badge
  //         variant="outline"
  //         className={cn(
  //           "text-xs",
  //           status === "pending" &&
  //             "bg-amber-100 border-amber-400 text-amber-600",
  //           status === "accepted" &&
  //             "bg-emerald-100 border-emerald-400 text-emerald-600",
  //           status === "rejected" &&
  //             "bg-red-100 border-red-400 text-red-600",
  //           status === "canceled" &&
  //             "bg-gray-100 border-gray-400 text-gray-600",
  //         )}
  //       >
  //         {status}
  //       </Badge>
  //     );
  //   },
  // },
  {
    id: "actions",
    cell: ({ row }) => <TableActions {...row.original} />,
  },
];
