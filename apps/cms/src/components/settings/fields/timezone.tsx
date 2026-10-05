"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import {
  type TimezoneValues,
  timezoneSchema,
  timezones,
} from "@marble/utils/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { organization } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { useWorkspace } from "@/providers/workspace";

export function Timezone() {
  const router = useRouter();
  const { activeWorkspace, isOwner } = useWorkspace();
  const queryClient = useQueryClient();

  const timezoneForm = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: { timezone: activeWorkspace?.timezone || "UTC" },
  });

  const { mutate: updateTimezone, isPending } = useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: z.infer<typeof timezoneSchema>;
    }) => {
      const res = await organization.update({
        organizationId,
        data: {
          timezone: data.timezone,
        },
      });
      if (res?.error) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Updated timezone");
      timezoneForm.reset({
        timezone: timezoneForm.getValues("timezone"),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.workspaces.list.key(),
      });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update workspace timezone";
      toast.error(errorMessage);
      console.error("Failed to update workspace timezone:", error);
    },
  });

  const onTimezoneSubmit = async (data: TimezoneValues) => {
    if (!isOwner || !activeWorkspace?.id) {
      return;
    }
    updateTimezone({
      organizationId: activeWorkspace.id,
      data,
    });
  };

  return (
    <SettingsSection
      description="The timezone of your workspace. Changes affect scheduled posts."
      title="Workspace Timezone"
    >
      <form
        className="flex flex-col gap-2 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-start"
        onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}
      >
        <div className="min-w-0 flex-1">
          <Label className="sr-only" htmlFor="timezone">
            Timezone
          </Label>
          <TimezoneSelector
            disabled={!isOwner}
            onValueChange={(value) => {
              timezoneForm.setValue("timezone", value, {
                shouldDirty: true,
              });
              timezoneForm.trigger("timezone");
            }}
            placeholder="Select timezone..."
            timezones={timezones}
            value={timezoneForm.watch("timezone")}
          />
          {timezoneForm.formState.errors.timezone && (
            <ErrorMessage>
              {timezoneForm.formState.errors.timezone.message}
            </ErrorMessage>
          )}
        </div>
        <AsyncButton
          className="w-20 self-end"
          disabled={!isOwner || !timezoneForm.formState.isDirty}
          isLoading={isPending}
          type="submit"
        >
          Save
        </AsyncButton>
      </form>
    </SettingsSection>
  );
}
