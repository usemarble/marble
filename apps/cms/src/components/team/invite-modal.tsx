"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogX,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type InviteData, inviteSchema } from "@/lib/validations/auth";
import { useWorkspace } from "@/providers/workspace";
import { AsyncButton } from "../ui/async-button";

export const InviteModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "member",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteData) => {
      const { data: result, error } = await organization.inviteMember({
        email: data.email,
        role: data.role,
      });

      if (error) {
        throw new Error(error.message);
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setOpen(false);
      reset();
      if (activeWorkspace?.id && activeWorkspace?.slug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE_BY_SLUG(activeWorkspace.slug),
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    },
  });

  const onSubmit = (data: InviteData) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="sm:max-w-md" variant="card">
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={UserAdd01Icon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              Invite Member
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogDescription className="sr-only">
          Invite a team member to your workspace.
        </DialogDescription>
        <DialogBody>
          <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-2">
              <Label className="sr-only" htmlFor="email">
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
              <Label className="sr-only" htmlFor="role">
                Role
              </Label>
              <Select
                defaultValue="member"
                onValueChange={(value) => {
                  if (value === "member" || value === "admin") {
                    setValue("role", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue className="capitalize" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <ErrorMessage>{errors.role.message}</ErrorMessage>
              )}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose size="sm">Close</DialogClose>
              <AsyncButton
                isLoading={inviteMutation.isPending}
                size="sm"
                type="submit"
              >
                Invite
              </AsyncButton>
            </DialogFooter>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
