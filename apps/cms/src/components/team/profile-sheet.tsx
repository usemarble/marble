import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { CalendarIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { organization } from "@/lib/auth/client";
import { AsyncButton } from "../ui/async-button";
import type { TeamMemberRow } from "./columns";

interface ProfileSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  member: TeamMemberRow;
}

export function ProfileSheet({ open, setOpen, member }: ProfileSheetProps) {
  const [role, setRole] = useState(member.role);
  const [loading, setLoading] = useState(false);

  const settingsChanges = useMemo(() => {
    return role !== member.role;
  }, [role, member.role]);

  async function handleSave() {
    setLoading(true);
    await organization.updateMemberRole({
      memberId: member.id,
      role: role,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Role updated");
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to update role");
        },
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>
            Manage {member.name}&apos;s access to the workspace.
          </SheetDescription>
        </SheetHeader>
        <div className="h-full flex flex-col justify-between">
          <div className="grid flex-1 auto-rows-min gap-6 px-6">
            <div className="grid gap-3">
              <div className="flex gap-3">
                <Avatar className="size-24 rounded-lg">
                  <AvatarImage src={member.image ?? undefined} />
                  <AvatarFallback>
                    {member.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 pt-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    <p className="text-sm">
                      Joined{" "}
                      {new Date(
                        member.joinedAt ?? new Date(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-6 justify-between">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(role) => setRole(role as "admin" | "member")}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 flex gap-2 justify-end">
            <AsyncButton
              onClick={handleSave}
              isLoading={loading}
              disabled={!settingsChanges}
              className="min-w-[100px]"
            >
              Save
            </AsyncButton>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
