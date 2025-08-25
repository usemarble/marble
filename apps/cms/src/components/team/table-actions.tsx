import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  ArrowClockwiseIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { authClient, organization } from "@/lib/auth/client";
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
  const [isCancelingInvite, setIsCancelingInvite] = useState(false);
  const [isResendingInvite, setIsResendingInvite] = useState(false);
  const {
    currentUserRole,
    currentUserId,
    type,
    role,
    status,
    id,
    userId,
    email,
  } = props;

  const isCurrentUser = currentUserId === userId;

  if (type === "invite") {
    const canManageInvites =
      currentUserRole === "owner" || currentUserRole === "admin";
    const isPending = status === "pending";
    if (!isPending) {
      return null;
    }

    const handleResendInvite = async () => {
      setIsResendingInvite(true);
      await authClient.organization.inviteMember({
        email: email,
        role: role,
        resend: true,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Invite resent", {
              id: "resend-invite",
            });
            setIsResendingInvite(false);
          },
          onError: (_ctx) => {
            toast.error("Failed to resend invite", {
              id: "resend-invite",
            });
            setIsResendingInvite(false);
          },
        },
      });
    };

    const handleCopyInviteLink = () => {
      const protocol =
        process.env.NODE_ENV === "development" ? "http" : "https";
      const inviteLink = `${protocol}://${process.env.NEXT_PUBLIC_APP_URL}/join/${id}`;
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!");
    };

    const cancelInvite = async (inviteId: string) => {
      setIsCancelingInvite(true);
      await organization.cancelInvitation({
        invitationId: inviteId,
        fetchOptions: {
          onSuccess: (_ctx) => {
            toast.success("Invitation canceled", {
              id: "cancel-invite",
            });
            setIsCancelingInvite(false);
          },
          onError: (_ctx) => {
            toast.error("Failed to cancel invitation", {
              id: "cancel-invite",
            });
            setIsCancelingInvite(false);
          },
        },
      });
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isResendingInvite || isCancelingInvite}
          >
            <span className="sr-only">Open menu</span>
            {isResendingInvite || isCancelingInvite ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <DotsThreeVerticalIcon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[180px] text-muted-foreground"
        >
          <DropdownMenuItem onClick={handleCopyInviteLink}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Copy Invite Link
          </DropdownMenuItem>
          {canManageInvites && (
            <DropdownMenuItem onClick={handleResendInvite}>
              <ArrowClockwiseIcon className="mr-2 h-4 w-4" />
              Resend Invite
            </DropdownMenuItem>
          )}
          {canManageInvites && (
            <DropdownMenuItem onClick={() => cancelInvite(id)}>
              <XCircleIcon className="mr-2 h-4 w-4" />
              Cancel Invite
            </DropdownMenuItem>
          )}
          {!canManageInvites && (
            <DropdownMenuItem disabled>
              No management actions available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

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
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <DotsThreeVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[180px] text-muted-foreground"
        >
          <DropdownMenuItem onClick={() => setShowProfileSheet(true)}>
            <ShieldCheckIcon className="mr-2 h-4 w-4" />
            Manage Access
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRemoveModal(true)}>
            <TrashIcon className="mr-2 h-4 w-4" />
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
