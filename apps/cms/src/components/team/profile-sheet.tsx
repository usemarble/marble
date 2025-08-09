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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Calendar } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { organization } from "@/lib/auth/client";
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
      role,
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
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetContent className="-translate-y-1/2 top-1/2 right-[10px] h-[calc(100vh-20px)] rounded-xl sm:max-w-[500px]">
        <SheetHeader className="py-6">
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>
            Manage {member.name}&apos;s access to the workspace.
          </SheetDescription>
        </SheetHeader>
        <section className="border-t py-6">
          <div className="flex gap-3">
            <Avatar className="size-24 rounded-lg">
              <AvatarImage src={member.image ?? undefined} />
              <AvatarFallback>
                {member.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 pt-1">
              <p className="font-medium">{member.name}</p>
              <p className="text-muted-foreground text-sm">{member.email}</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="size-4" />
                <p className="text-sm">
                  Joined{" "}
                  {new Date(member.joinedAt ?? new Date()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t py-6">
          <div className="flex items-center justify-between gap-6">
            <Label>Role</Label>
            <Select
              onValueChange={(userRole) =>
                setRole(userRole as "admin" | "member")
              }
              value={role}
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
        </section>
        <section className="sticky bottom-0 mt-auto border-t bg-background py-4">
          <SheetFooter className="flex justify-end gap-2">
            <SheetClose asChild>
              <Button className="min-w-[100px]" size="sm" variant="outline">
                Close
              </Button>
            </SheetClose>
            <Button
              className="min-w-[100px]"
              disabled={!settingsChanges}
              onClick={handleSave}
              size="sm"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </SheetFooter>
        </section>
      </SheetContent>
    </Sheet>
  );
}
