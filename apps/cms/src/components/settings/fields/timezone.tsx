"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: z.infer<typeof timezoneSchema>;
    }) => {
      return await organization.update({
        organizationId,
        data: {
          timezone: data.timezone,
        },
      });
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
    if (!isOwner || !activeWorkspace?.id) return;
    updateTimezone({
      organizationId: activeWorkspace.id,
      data,
    });
  };

  return (
    <Card className="pt-2">
      <CardHeader className="px-6">
        <CardTitle className="text-lg font-medium">
          Workspace Timezone
        </CardTitle>
        <CardDescription>The timezone of your workspace.</CardDescription>
      </CardHeader>
      <form onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}>
        <CardContent className="px-6">
          <div className="flex flex-col gap-2 w-full">
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
            </div>
            {timezoneForm.formState.errors.timezone && (
              <p className="text-xs text-destructive">
                {timezoneForm.formState.errors.timezone.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Changes affect scheduled posts
          </p>
          <Button
            disabled={!isOwner || !timezoneForm.formState.isDirty || isPending}
            className={cn("w-20 self-end flex gap-2 items-center")}
            size="sm"
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
