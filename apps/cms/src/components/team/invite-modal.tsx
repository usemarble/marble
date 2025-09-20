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
      if (activeWorkspace?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace.id),
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
            {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
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
            isLoading={inviteMutation.isPending}
            className="flex w-full gap-2 mt-4"
          >
            Invite
          </AsyncButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};
