"use client";

import { InviteModal } from "@/components/team/invite-modal";
import type { ActiveOrganization, Session } from "@/lib/auth/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { MailPlus, MoreHorizontal, RefreshCw, UserMinus } from "lucide-react";
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

  const isOwner =
    optimisticOrg?.members.find((member) => member.role === "owner")?.id ===
    props.session?.user.id;

  return (
    <div className="container py-8">
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
                  <span className="text-sm text-muted-foreground">
                    {member.role.toLowerCase()}
                  </span>
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

        {optimisticOrg?.invitations?.length && (
          <div className="rounded-lg border">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Pending Invites</h2>
            </div>
            <div className="divide-y">
              {optimisticOrg.invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {invite.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited by{" "}
                        {
                          optimisticOrg?.members.find(
                            (m) => m.id === invite.inviterId,
                          )?.user.name
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {invite.role}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend invite
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <UserMinus className="mr-2 h-4 w-4" />
                          Cancel invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <InviteModal open={showInviteModal} setOpen={setShowInviteModal} />
    </div>
  );
}

export default PageClient;
