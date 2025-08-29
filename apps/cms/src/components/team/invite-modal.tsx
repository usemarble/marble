"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { toast } from "@marble/ui/components/sonner";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { organization } from "@/lib/auth/client";
import { type InviteData, inviteSchema } from "@/lib/validations/auth";
import type { Workspace } from "@/types/workspace";
import { AsyncButton } from "../ui/async-button";

export const InviteModal = ({
  open,
  setOpen,
  setOptimisticOrg,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOptimisticOrg: React.Dispatch<React.SetStateAction<Workspace | null>>;
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
                invitations: [
                  ...(prev.invitations || []),
                  {
                    id: res.data.id,
                    email: res.data.email,
                    role: res.data.role,
                    status: res.data.status,
                    organizationId: res.data.organizationId,
                    inviterId: res.data.inviterId,
                    expiresAt: res.data.expiresAt,
                  },
                ],
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
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Invite Member
          </DialogTitle>
          <DialogDescription className="sr-only">
            Invite a team member to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
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
            <Label htmlFor="role" className="sr-only">
              Role
            </Label>
            <Select
              onValueChange={(value: "member" | "admin") =>
                setValue("role", value)
              }
              defaultValue="member"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <ErrorMessage>{errors.role.message}</ErrorMessage>}
          </div>

          <AsyncButton
            type="submit"
            isLoading={isSubmitting}
            className="flex w-full gap-2 mt-4"
          >
            Invite
          </AsyncButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};
