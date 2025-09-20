"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@marble/ui/components/switch";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type AiEnableValues,
  aiEnableSchema,
} from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";

export function Enable() {
  const router = useRouter();
  const { activeWorkspace, isOwner } = useWorkspace();
  const queryClient = useQueryClient();
  const enableId = useId();

  const enableForm = useForm<AiEnableValues>({
    resolver: zodResolver(aiEnableSchema),
    defaultValues: { aiEnabled: activeWorkspace?.aiEnabled || false },
  });

  const { mutate: updateAiSettings, isPending } = useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: AiEnableValues;
    }) => {
      return await organization.update({
        organizationId,
        data: {
          ai: {
            enabled: data.aiEnabled,
          }
        },
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.data.aiEnabled
          ? "AI integration enabled"
          : "AI integration disabled",
      );
      enableForm.reset({ aiEnabled: enableForm.getValues("aiEnabled") });P
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
      });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update AI settings";
      toast.error(errorMessage);
      console.error("Failed to update AI settings:", error);
    },
  });

  const onEnableSubmit = (data: AiEnableValues) => {
    if (!isOwner || !activeWorkspace?.id) return;
    updateAiSettings({
      organizationId: activeWorkspace.id,
      data: { aiEnabled: data.aiEnabled },
    });
  };

  return (
    <Card className="pb-4">
      <CardHeader>
        <CardTitle className="text-lg font-medium">AI Integration</CardTitle>
        <CardDescription>
          Enable AI-powered writing suggestions and content assistance for your
          workspace
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={enableForm.handleSubmit(onEnableSubmit)}
        className="flex flex-col gap-6"
      >
        <CardContent>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor={enableId} className="text-sm font-medium">
                  Enable AI Features
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enabling AI features will share your content with third party AI providers.
                </p>
              </div>
              <Switch
                id={enableId}
                checked={enableForm.watch("aiEnabled")}
                onCheckedChange={(checked) =>
                  enableForm.setValue("aiEnabled", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!isOwner}
              />
            </div>
            {enableForm.formState.errors.aiEnabled && (
              <p className="text-xs text-destructive">
                {enableForm.formState.errors.aiEnabled.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <p className="text-sm text-muted-foreground">
            {enableForm.watch("aiEnabled")
              ? "AI features are enabled for this workspace"
              : "AI features are disabled for this workspace"}
          </p>
          <AsyncButton
            isLoading={isPending}
            className={cn("w-20 self-end flex gap-2 items-center")}
            disabled={!isOwner || !enableForm.formState.isDirty}
          >
            Save
          </AsyncButton>
        </CardFooter>
      </form>
    </Card>
  );
}
