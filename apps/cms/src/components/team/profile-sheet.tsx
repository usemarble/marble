import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
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
  const [role, setRole] = useState(member.role || "");
  const [loading, setLoading] = useState(false);

  const settingsChanges = useMemo(() => {
    return role !== (member.role || "");
  }, [role, member.role]);

  async function handleSave() {
    setLoading(true);

    // Map custom roles to standard roles for better-auth
    const mappedRole = mapToStandardRole(role);

    await organization.updateMemberRole({
      memberId: member.id,
      role: mappedRole,
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

  // Helper function to map custom roles to standard roles
  function mapToStandardRole(customRole: string): "admin" | "member" {
    const adminRoles = ["admin", "administrator", "owner", "manager"];
    const lowerRole = customRole.toLowerCase();

    return adminRoles.some((role) => lowerRole.includes(role))
      ? "admin"
      : "member";
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-[500px] h-[calc(100vh-20px)] top-1/2 -translate-y-1/2 right-[10px] rounded-xl">
        <SheetHeader className="py-6">
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>
            Manage {member.name}&apos;s access to the workspace.
          </SheetDescription>
        </SheetHeader>
        <section className="py-6 border-t">
          <div className="flex gap-3">
            <Avatar className="size-24 rounded-lg">
              <AvatarImage src={member.image ?? undefined} />
              <AvatarFallback>
                {member.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 pt-1">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
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
          <div className="flex items-center gap-6 justify-between">
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Technical Writer, Admin, Member"
              className="w-[220px]"
            />
          </div>
        </section>
        <section className="border-t mt-auto py-4 sticky bottom-0 bg-background">
          <SheetFooter className="flex gap-2 justify-end">
            <SheetClose asChild>
              <Button variant="outline" size="sm" className="min-w-[100px]">
                Close
              </Button>
            </SheetClose>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!settingsChanges}
              className="min-w-[100px]"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </SheetFooter>
        </section>
      </SheetContent>
    </Sheet>
  );
}
