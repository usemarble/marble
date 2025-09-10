import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  DotsThreeVerticalIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { TeamMemberRow } from "./columns";
import { ProfileSheet } from "./profile-sheet";
import { RemoveMemberModal } from "./team-modals";

interface TableActionsProps extends TeamMemberRow {
  currentUserRole: "owner" | "admin" | "member" | undefined;
  currentUserId: string | undefined;
}

export default function TableActions(props: TableActionsProps) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const { currentUserRole, currentUserId, role, userId } = props;

  const isCurrentUser = currentUserId === userId;

  if (role === "owner") {
    return null;
  }

  if (isCurrentUser) {
    return null;
  }

  if (currentUserRole === "member") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-8 p-0 data-[state=open]:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-muted-foreground">
          <DropdownMenuItem onClick={() => setShowProfileSheet(true)}>
            <ShieldCheckIcon className="size-4" />
            Manage Access
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowRemoveModal(true)}
            variant="destructive"
          >
            <TrashIcon className="size-4" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveMemberModal
        open={showRemoveModal}
        setOpen={setShowRemoveModal}
        member={props}
      />
      <ProfileSheet
        open={showProfileSheet}
        setOpen={setShowProfileSheet}
        member={props}
      />
    </>
  );
}
