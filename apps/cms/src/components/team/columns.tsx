"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import { cn } from "@marble/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { isBefore } from "date-fns";
import TableActions from "./table-actions";

// Define the roles explicitly
type UserRole = "owner" | "admin" | "member";
// Define possible invitation statuses
type InvitationStatus = "pending" | "accepted" | "rejected" | "canceled";

// Combined type for both members and invites
export type TeamMemberRow = {
  id: string; // Member ID or Invitation ID
  type: "member" | "invite"; // Type identifier
  name: string | null; // User name (null for invites)
  email: string;
  image: string | null; // User image (null for invites)
  role: UserRole; // User role in the org (roles are also defined for invites)
  status: InvitationStatus; // Invitation status or 'accepted' for members
  inviterId?: string | null; // ID of the user who invited (for invites)
  expiresAt?: Date | null; // Expiry date (for invites)
  // Add userId if available for members, might be useful for actions
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
      const avatarSrc =
        item.image ??
        (item.type === "invite"
          ? `https://api.dicebear.com/9.x/glass/svg?seed=${item.email}`
          : undefined);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{displayName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      type DisplayStatus = InvitationStatus | "expired";

      let displayStatus: DisplayStatus = item.status;
      let _isExpired = false;
      if (
        item.status === "pending" &&
        item.expiresAt &&
        isBefore(new Date(item.expiresAt), new Date())
      ) {
        displayStatus = "expired";
        _isExpired = true;
      }

      if (displayStatus === "accepted") {
        return null;
      }

      return (
        <Badge
          className={cn(
            "text-xs capitalize",
            displayStatus === "pending" &&
              "border-amber-400 bg-amber-100 text-amber-600",
            displayStatus === "rejected" &&
              "border-red-400 bg-red-100 text-red-600",
            (displayStatus === "canceled" || displayStatus === "expired") &&
              "border-gray-400 bg-gray-100 text-gray-600"
          )}
          variant="outline"
        >
          {displayStatus === "pending" ? "Invited" : displayStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const item = row.original;

      return <p className="text-muted-foreground capitalize">{item.role}</p>;
    },
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end pr-10">Actions</div>,
    // Pass the context including the row data and the additional props
    cell: ({ row, table }) => {
      // Access props passed to DataTable via table options meta
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
