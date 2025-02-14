import type { InviteStatus, RoleType } from "@marble/db/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { Mail, MoreHorizontal, RefreshCw, UserMinus } from "lucide-react";

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

export function MembersList({
  members,
  invites,
  workspaceId,
}: {
  members: Member[];
  invites: Invite[];
  workspaceId: string;
}) {
  return (
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
                    {member.user.name?.charAt(0) ?? member.user.email.charAt(0)}
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
                      Invited by {invite.inviter.name || invite.inviter.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {invite.role.toLowerCase()}
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
  );
}
