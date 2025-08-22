"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
    mutationFn: async (data: z.infer<typeof timezoneSchema>) => {
      await organization.update({
        // biome-ignore lint/style/noNonNullAssertion: <>
        organizationId: activeWorkspace?.id!,
        data: {
          timezone: data.timezone,
        },
      });
    },
    onSuccess: () => {
      toast.success("Updated timezone");
      timezoneForm.reset({
        timezone: timezoneForm.getValues("timezone"),
      });
      queryClient.invalidateQueries({
        // biome-ignore lint/style/noNonNullAssertion: <>
        queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace?.id!),
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onTimezoneSubmit = async (data: TimezoneValues) => {
    if (!isOwner || !activeWorkspace?.id) return;
    updateTimezone(data);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Workspace Timezone
        </CardTitle>
        <CardDescription>
          The timezone of your workspace. (Used for scheduled posts and the
          display of dates)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}
          className="flex flex-col gap-2 w-full"
        >
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="timezone" className="sr-only">
                Timezone
              </Label>
              <TimezoneSelector
                value={timezoneForm.watch("timezone")}
                onValueChange={(value) => {
                  timezoneForm.setValue("timezone", value, {
                    shouldDirty: true,
                  });
                  timezoneForm.trigger("timezone");
                }}
                disabled={!isOwner}
                placeholder="Select timezone..."
                timezones={timezones}
              />
            </div>
            <Button
              disabled={
                !isOwner || !timezoneForm.formState.isDirty || isPending
              }
              className={cn("w-20 self-end flex gap-2 items-center")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
          </div>
          {timezoneForm.formState.errors.timezone && (
            <p className="text-xs text-destructive">
              {timezoneForm.formState.errors.timezone.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
