"use client";

import { ErrorMessage } from "@/components/auth/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { Loader } from "@repo/ui/lib/icons";
import { useForm } from "react-hook-form";

import { organization } from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth/types";
import { type InviteData, inviteSchema } from "@/lib/validations/auth";
// import { RoleType } from "@repo/db/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

export const InviteModal = ({
  open,
  setOpen,
  setOptimisticOrg,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOptimisticOrg: React.Dispatch<
    React.SetStateAction<ActiveOrganization | null>
  >;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "member",
    },
  });

  const onSubmit = async (data: InviteData) => {
    try {
      const res = await organization.inviteMember({
        email: data.email,
        role: data.role,
      });
      if (res.data) {
        setOpen(false);
        toast.success("Invitation sent successfully");
        setOptimisticOrg((prev) =>
          prev
            ? {
                ...prev,
                invitations: [...prev.invitations, res.data],
              }
            : null,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invite",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription className="sr-only">
            Invite a team member to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email")}
              placeholder="teammate@company.com"
              type="email"
            />
            {errors.email && (
              <ErrorMessage>{errors.email.message}</ErrorMessage>
            )}
          </div>

          <div className="grid flex-1 gap-2">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value: "member" | "admin") =>
                setValue("role", value)
              }
              defaultValue="member"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <ErrorMessage>{errors.role.message}</ErrorMessage>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full gap-2"
          >
            {isSubmitting && <Loader className="size-4 animate-spin" />}
            Invite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
