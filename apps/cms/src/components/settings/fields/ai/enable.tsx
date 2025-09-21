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
          },
        },
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.data.aiEnabled
          ? "AI integration enabled"
          : "AI integration disabled"
      );
      enableForm.reset({ aiEnabled: enableForm.getValues("aiEnabled") });

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
    if (!isOwner || !activeWorkspace?.id) {
      return;
    }
    updateAiSettings({
      organizationId: activeWorkspace.id,
      data: { aiEnabled: data.aiEnabled },
    });
  };

  return (
    <Card className="pb-4">
      <CardHeader>
        <CardTitle className="font-medium text-lg">AI Integration</CardTitle>
        <CardDescription>
          Enable AI-powered writing suggestions and content assistance for your
          workspace
        </CardDescription>
      </CardHeader>
      <form
        className="flex flex-col gap-6"
        onSubmit={enableForm.handleSubmit(onEnableSubmit)}
      >
        <CardContent>
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label className="font-medium text-sm" htmlFor={enableId}>
                  Enable AI Features
                </Label>
                <p className="text-muted-foreground text-xs">
                  Enabling AI features will share your content with third party
                  AI providers.
                </p>
              </div>
              <Switch
                checked={enableForm.watch("aiEnabled")}
                disabled={!isOwner}
                id={enableId}
                onCheckedChange={(checked) =>
                  enableForm.setValue("aiEnabled", checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>
            {enableForm.formState.errors.aiEnabled && (
              <p className="text-destructive text-xs">
                {enableForm.formState.errors.aiEnabled.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-muted-foreground text-sm">
            {enableForm.watch("aiEnabled")
              ? "AI features are enabled for this workspace"
              : "AI features are disabled for this workspace"}
          </p>
          <AsyncButton
            className={cn("flex w-20 items-center gap-2 self-end")}
            disabled={!isOwner || !enableForm.formState.isDirty}
            isLoading={isPending}
          >
            Save
          </AsyncButton>
        </CardFooter>
      </form>
    </Card>
  );
}
