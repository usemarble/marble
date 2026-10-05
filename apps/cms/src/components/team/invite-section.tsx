"use client";

import type { RouterOutputs } from "@marble/api/routers";
import { Avatar, AvatarFallback } from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { toast } from "@marble/ui/components/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import {
  ArrowsClockwiseIcon,
  DotsThreeVerticalIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organization } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";

type Invite = RouterOutputs["workspaces"]["invitations"]["list"][number];

interface InviteSectionProps {
  invitations: Invite[];
  workspaceId: string;
}

export function InviteSection({
  invitations,
  workspaceId,
}: InviteSectionProps) {
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
        organizationId: workspaceId,
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
    onSuccess: async (_data, _variables) => {
      toast.success("Invitation resent successfully", {
        id: "resend-invitation",
      });

      await queryClient.invalidateQueries({
        queryKey: orpc.workspaces.invitations.list.key({
          input: { workspaceId },
        }),
      });
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
    onSuccess: async (_data, _variables) => {
      toast.success("Invitation canceled successfully", {
        id: "cancel-invitation",
      });

      await queryClient.invalidateQueries({
        queryKey: orpc.workspaces.invitations.list.key({
          input: { workspaceId },
        }),
      });
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
    <section aria-labelledby="invitations-heading" className="space-y-3">
      <h2 className="font-medium text-sm" id="invitations-heading">
        Invitations
      </h2>
      <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
        <Table className="-mb-1 h-fit border-separate border-spacing-y-1">
          <TableHeader>
            <TableRow className="border-0 text-[13px] hover:bg-transparent">
              <TableHead className="px-3 text-muted-foreground">User</TableHead>
              <TableHead className="px-3 text-muted-foreground">Role</TableHead>
              <TableHead className="px-3 text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-12 px-3 text-right text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingInvitations.map((invitation) => (
              <TableRow
                className="h-[60px] border-0 bg-background hover:bg-background/80"
                key={invitation.id}
              >
                <TableCell className="px-3 py-2 first:rounded-l-[14px]">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>
                        {invitation.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {invitation.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Badge className="capitalize" variant="outline">
                    {invitation.role || "member"}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Badge variant="secondary">
                    {new Date(invitation.expiresAt).getTime() <= Date.now()
                      ? "Expired"
                      : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 last:rounded-r-[14px]">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            className="size-8 p-0"
                            disabled={
                              resendInviteMutation.isPending ||
                              cancelInviteMutation.isPending
                            }
                            variant="ghost"
                          >
                            <span className="sr-only">
                              Manage invitation for {invitation.email}
                            </span>
                            <DotsThreeVerticalIcon size={16} weight="bold" />
                          </Button>
                        }
                      />
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
