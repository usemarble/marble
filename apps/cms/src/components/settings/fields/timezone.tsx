"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AsyncButton } from "@/components/ui/async-button";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { organization } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type TimezoneValues,
  timezoneSchema,
} from "@/lib/validations/workspace";
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
    onSuccess: (_, variables) => {
      toast.success("Updated timezone");
      timezoneForm.reset({
        timezone: timezoneForm.getValues("timezone"),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
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
    <Card className="rounded-[20px] border-none bg-sidebar p-2">
      <form
        className="flex flex-col"
        onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}
      >
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="font-medium text-lg">
              Workspace Timezone
            </CardTitle>
            <CardDescription>The timezone of your workspace.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-2">
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
              </div>
            </div>
            {timezoneForm.formState.errors.timezone && (
              <p className="text-destructive text-xs">
                {timezoneForm.formState.errors.timezone.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-muted-foreground text-sm">
            Changes affect scheduled posts
          </p>
          <AsyncButton
            className={cn("flex w-20 items-center gap-2 self-end")}
            disabled={!isOwner || !timezoneForm.formState.isDirty}
            isLoading={isPending}
            size="sm"
          >
            Save
          </AsyncButton>
        </div>
      </form>
    </Card>
  );
}
