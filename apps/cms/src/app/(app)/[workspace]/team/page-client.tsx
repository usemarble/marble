"use client";

import { InviteModal } from "@/components/team/invite-modal";
import { organization } from "@/lib/auth/client";
import type { ActiveOrganization, Session } from "@/lib/auth/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { CopyIcon, MailPlus, MoreHorizontal, UserMinus } from "lucide-react";
import { useState } from "react";

interface PageClientProps {
  activeOrganization: ActiveOrganization | null;
  session: Session | null;
}

function PageClient(props: PageClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [optimisticOrg, setOptimisticOrg] = useState<ActiveOrganization | null>(
    props.activeOrganization,
  );
  const [isCancelingInvite, setIsCancelingInvite] = useState(false);

  const isOwner =
    optimisticOrg?.members.find((member) => member.role === "owner")?.id ===
    props.session?.user.id;

  const cancelInvite = async (inviteId: string) => {
    setIsCancelingInvite(true);
    try {
      await organization.cancelInvitation({
        invitationId: inviteId,
        fetchOptions: {
          onRequest: (ctx) => {
            toast.loading("Canceling invitation...", {
              position: "top-center",
              id: "cancel-invite",
            });
          },
          onSuccess: (ctx) => {
            toast.success("Invitation canceled", {
              position: "top-center",
              id: "cancel-invite",
            });
            setOptimisticOrg(
              (prev) =>
                prev && {
                  ...prev,
                  invitations: prev.invitations.filter(
                    (invite) => invite.id !== inviteId,
                  ),
                },
            );
          },
        },
      });
    } catch (error) {
      toast.error("Failed to cancel invitation", {
        position: "top-center",
        id: "cancel-invite",
      });
    } finally {
      setIsCancelingInvite(false);
    }
  };

  const copyInviteLink = (inviteId: string) => {
    navigator.clipboard.writeText(
      `https://marblecms-app.com/invite/${inviteId}`,
    );
    toast.success("Invite link copied to clipboard", {
      position: "top-center",
    });
  };

  const getInviterDisplay = (inviterId: string) => {
    if (inviterId === props.session?.user.id) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-red-100 border-red-400 text-red-600"
        >
          you
        </Badge>
      );
    }

    const inviter = optimisticOrg?.members.find((m) => m.id === inviterId);
    return inviter?.user.name || inviter?.user.email || "Unknown user";
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button
          onClick={() => setShowInviteModal(true)}
          size="sm"
          variant="outline"
        >
          <MailPlus size={16} />
          <span>invite member</span>
        </Button>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Members</h2>
          </div>
          <div className="divide-y">
            {optimisticOrg?.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.image ?? undefined} />
                    <AvatarFallback>
                      {member.user.name?.charAt(0) ??
                        member.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs bg-red-100 border-red-400 text-red-600",
                      member.role === "owner" &&
                        "bg-blue-100 border-blue-400 text-blue-600",
                      member.role === "admin" &&
                        "bg-green-100 border-green-400 text-green-600",
                    )}
                  >
                    {member.role.toLowerCase()}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={member.role === "owner"}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          member.role === "owner" && "cursor-not-allowed",
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {member.role !== "owner" && (
                        <DropdownMenuItem>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invites</h2>
              {optimisticOrg?.invitations.filter((i) => i.status === "pending").length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending invites
                </p>
              )}
            </div>
          </div>
          {optimisticOrg?.invitations &&
            optimisticOrg.invitations.length > 0 && (
              <div className="divide-y">
                {optimisticOrg.invitations
                  .filter((inv) => inv.status === "pending")
                  .map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${invite.email}`}
                          />
                          <AvatarFallback>
                            {invite.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{invite.email}</p>
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-100 border-amber-400 text-amber-600"
                            >
                              Pending
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Invited by {getInviterDisplay(invite.inviterId)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invite.id)}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isCancelingInvite}
                          onClick={() => cancelInvite(invite.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </div>
      </div>
      <InviteModal
        open={showInviteModal}
        setOpen={setShowInviteModal}
        setOptimisticOrg={setOptimisticOrg}
      />
    </div>
  );
}

export default PageClient;
