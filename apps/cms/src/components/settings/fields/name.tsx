"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { type NameValues, nameSchema } from "@marble/utils/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import type { SubmitErrorHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

export function Name() {
  const router = useRouter();
  const { activeWorkspace, isOwner } = useWorkspace();
  const queryClient = useQueryClient();
  const nameId = useId();

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: activeWorkspace?.name || "" },
  });

  const { mutate: updateName, isPending } = useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: NameValues;
    }) => {
      const res = await organization.update({
        organizationId,
        data: {
          name: data.name,
        },
      });
      if (res?.error) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (_, variables) => {
      toast.success("Workspace name updated");
      nameForm.reset({ name: nameForm.getValues("name") });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
      });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update workspace name";
      toast.error(errorMessage);
      console.error("Failed to update workspace name:", error);
    },
  });

  const onNameSubmit = (data: NameValues) => {
    // need to work on proper permissons later
    if (!isOwner || !activeWorkspace?.id) {
      return;
    }
    updateName({
      organizationId: activeWorkspace.id,
      data: { name: data.name.trim() },
    });
  };

  const onNameInvalid: SubmitErrorHandler<NameValues> = (errors) => {
    const message = errors.name?.message;
    if (message) {
      toast.error(message);
    }
  };

  return (
    <SettingsSection
      description="The name of your workspace on Marble, typically your website's name."
      title="Workspace Name"
    >
      <form
        className="flex flex-col gap-2 rounded-[14px] bg-background px-4 py-3.5"
        onSubmit={nameForm.handleSubmit(onNameSubmit, onNameInvalid)}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <Label className="sr-only" htmlFor={nameId}>
              Name
            </Label>
            <Input
              id={nameId}
              {...nameForm.register("name")}
              disabled={!isOwner}
              placeholder="Technology"
            />
            {nameForm.formState.errors.name && (
              <ErrorMessage>
                {nameForm.formState.errors.name.message}
              </ErrorMessage>
            )}
          </div>
          <AsyncButton
            className="w-20 self-end"
            disabled={!isOwner || !nameForm.formState.isDirty}
            isLoading={isPending}
            type="submit"
          >
            Save
          </AsyncButton>
        </div>
      </form>
    </SettingsSection>
  );
}
