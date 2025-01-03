"use client";

import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspace } from "@/components/providers/workspace";
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
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { RoleType } from "@repo/db/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

export const InviteMemberModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const inviteSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    role: z.enum([RoleType.ADMIN, RoleType.MEMBER], {
      required_error: "Please select a role",
    }),
  });

  type InviteMemberValues = z.infer<typeof inviteSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: RoleType.MEMBER,
    },
  });

  const onSubmit = async (data: InviteMemberValues) => {
    try {
      const res = await authClient.organization.inviteMember({
        email: data.email,
        role: data.role,
      });
      if (res.data) {
        setOpen(false);
        toast.success("Invitation sent successfully");
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
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Invite a team member to collaborate in your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email">Email address</Label>
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
              onValueChange={(value: Exclude<RoleType, "OWNER">) =>
                setValue("role", value)
              }
              defaultValue={RoleType.MEMBER}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RoleType.MEMBER}>Member</SelectItem>
                <SelectItem value={RoleType.ADMIN}>Admin</SelectItem>
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
            Send Invite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
