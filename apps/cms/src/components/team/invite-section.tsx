"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  ArrowsClockwiseIcon,
  DotsThreeVerticalIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

interface Invite {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string | Date;
  inviterId: string;
}

interface InviteSectionProps {
  invitations: Invite[];
}

export function InviteSection({ invitations }: InviteSectionProps) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  const resendInviteMutation = useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      inviteId: string;
      email: string;
      role: string;
    }) => {
      const { data, error } = await organization.inviteMember({
        email,
        role: role as "owner" | "admin" | "member",
        resend: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Resending invitation...", {
        id: "resend-invitation",
      });
    },
    onSuccess: (_data, _variables) => {
      toast.success("Invitation resent successfully", {
        id: "resend-invitation",
      });

      if (activeWorkspace?.id && activeWorkspace?.slug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE_BY_SLUG(activeWorkspace.slug),
        });
      }
    },
    onError: (error, _variables) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend invitation",
        {
          id: "resend-invitation",
        }
      );
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await organization.cancelInvitation({
        invitationId: inviteId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Canceling invitation...", {
        id: "cancel-invitation",
      });
    },
    onSuccess: (_data, _variables) => {
      toast.success("Invitation canceled successfully", {
        id: "cancel-invitation",
      });

      if (activeWorkspace?.id && activeWorkspace?.slug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE_BY_SLUG(activeWorkspace.slug),
        });
      }
    },
    onError: (error, _variables) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation",
        {
          id: "cancel-invitation",
        }
      );
    },
  });

  const handleResendInvite = (invitation: Invite) => {
    resendInviteMutation.mutate({
      inviteId: invitation.id,
      email: invitation.email,
      role: invitation.role || "member",
    });
  };

  const handleCancelInvite = (invitation: Invite) => {
    cancelInviteMutation.mutate(invitation.id);
  };

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-[20px] border-none bg-sidebar p-2.5">
      <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription className="sr-only">
              {pendingInvitations.length} invitation
              {pendingInvitations.length !== 1 ? "s" : ""} waiting for response
            </CardDescription>
          </div>
        </div>
        <div className="space-y-3 divide-y">
          {pendingInvitations.map((invitation) => (
            <div
              className="flex items-center justify-between rounded-sm border p-3"
              key={invitation.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <span className="font-medium text-sm">
                    {invitation.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{invitation.email}</p>
                  <Badge className="text-xs capitalize" variant="outline">
                    {invitation.role || "member"}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={
                      resendInviteMutation.isPending ||
                      cancelInviteMutation.isPending
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <DotsThreeVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={
                      resendInviteMutation.isPending ||
                      cancelInviteMutation.isPending
                    }
                    onClick={() => handleResendInvite(invitation)}
                  >
                    <ArrowsClockwiseIcon className="size-4" />
                    Resend Invite
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      resendInviteMutation.isPending ||
                      cancelInviteMutation.isPending
                    }
                    onClick={() => handleCancelInvite(invitation)}
                    variant="destructive"
                  >
                    <XIcon className="size-4" />
                    Cancel Invite
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
