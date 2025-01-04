"use client";

import { Add } from "@/components/icons/isometric";
import { InviteMemberModal } from "@/components/team/invite-member-modal";
import { MembersList } from "@/components/team/members-list";
import type { InviteStatus, RoleType } from "@repo/db/client";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Mail, MoreHorizontal, RefreshCw, UserMinus } from "lucide-react";
type Member = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

type Invite = {
  user: {
    name: string;
    email: string;
  };
  id: string;
  organizationId: string;
  role: string | null;
  email: string;
  status: string;
  expiresAt: Date;
  inviterId: string;
};

interface PageClientProps {
  members: Member[];
  invites: Invite[];
  workspaceId: string;
}

function PageClient({
  members = [],
  invites = [],
  workspaceId,
}: PageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (members.length === 0 && invites.length === 0) {
    return (
      <section className="grid h-full w-full place-content-center">
        <div className="flex flex-col items-center">
          <Add className="size-40 text-primary" />
          <div className="flex flex-col items-center gap-10">
            <p className="text-balance max-w-2xl mx-auto text-center">
              No team members yet. Invite your team members to collaborate.
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              size="sm"
              className="hover:ring-primary group flex items-center gap-2 text-sm capitalize transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-2"
            >
              <Plus size={16} />
              <span>Invite member</span>
            </Button>
          </div>
        </div>
        <InviteMemberModal open={isOpen} setOpen={setIsOpen} />
      </section>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="hover:ring-primary group flex items-center gap-2 text-sm capitalize transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-2"
        >
          <Plus size={16} />
          <span>Invite member</span>
        </Button>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Members</h2>
          </div>
          <div className="divide-y">
            {members.map((member) => (
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
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        {invites.length > 0 && (
          <div className="rounded-lg border">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Pending Invites</h2>
            </div>
            <div className="divide-y">
              {invites.map((invite) => (
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
                        Invited by {invite.user.name || invite.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {invite.role?.toLowerCase()}
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
      <InviteMemberModal open={isOpen} setOpen={setIsOpen} />
    </div>
  );
}

export default PageClient;
