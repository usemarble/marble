"use client";

import { Add } from "@/components/icons/isometric";
import { InviteMemberModal } from "@/components/team/invite-member-modal";
import { MembersList } from "@/components/team/members-list";
import type { InviteStatus, RoleType } from "@repo/db/client";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";

type Member = {
  id: string;
  role: RoleType;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Invite = {
  id: string;
  email: string;
  role: RoleType;
  status: InviteStatus;
  inviter: {
    name: string | null;
    email: string;
  };
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
      <MembersList
        members={members}
        invites={invites}
        workspaceId={workspaceId}
      />
      <InviteMemberModal open={isOpen} setOpen={setIsOpen} />
    </div>
  );
}

export default PageClient;
