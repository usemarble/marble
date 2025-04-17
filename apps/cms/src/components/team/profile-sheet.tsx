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
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { TeamMemberRow } from "./columns";

interface ProfileSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  member: TeamMemberRow;
}

export function ProfileSheet({ open, setOpen, member }: ProfileSheetProps) {
  const [role, setRole] = useState(member.role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="p-6">
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>
            View and manage {member.name}&apos;s access to the workspace.
          </SheetDescription>
        </SheetHeader>
        <section className="p-6 border-t">
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
                <CalendarDays className="size-4" />
                <p className="text-sm">
                  Joined {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t p-6">
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
        </section>
        <section className="border-t mt-auto p-4 sticky bottom-0 bg-background">
          <SheetFooter className="flex gap-2 justify-end">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </SheetClose>
            <Button size="sm" disabled>
              Save
            </Button>
          </SheetFooter>
        </section>
      </SheetContent>
    </Sheet>
  );
}
