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
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type AiEnableValues,
  aiEnableSchema,
} from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";
import type { Workspace } from "@/types/workspace";

export function Enable() {
  const router = useRouter();
  const { activeWorkspace, isOwner } = useWorkspace();
  const queryClient = useQueryClient();
  const enableId = useId();

  const enableForm = useForm<AiEnableValues>({
    resolver: zodResolver(aiEnableSchema),
    defaultValues: { ai: { enabled: activeWorkspace?.ai?.enabled ?? false } },
  });

  const { mutate: updateAiSettings, isPending } = useMutation({
    mutationFn: async (variables: {
      workspaceId: string;
      data: AiEnableValues;
    }) => {
      try {
        const res = await fetch("/api/editor/preferences", {
          method: "PATCH",
          body: JSON.stringify({
            ai: {
              enabled: variables.data.ai.enabled,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(
            `Failed to update AI settings: ${res.status} ${res.statusText}`
          );
        }
        const data = await res.json();
        return data;
      } catch (error) {
        throw error instanceof Error
          ? error
          : new Error("Failed to update AI settings");
      }
    },

    onMutate: async (newData) => {
      if (!newData.workspaceId) {
        return;
      }

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.WORKSPACE(newData.workspaceId),
      });

      const previousWorkspace = queryClient.getQueryData<Workspace>(
        QUERY_KEYS.WORKSPACE(newData.workspaceId)
      );

      queryClient.setQueryData<Workspace | undefined>(
        QUERY_KEYS.WORKSPACE(newData.workspaceId),
        (old) =>
          old
            ? {
                ...old,
                ai: {
                  ...(old.ai ?? {}),
                  enabled: newData.data.ai.enabled,
                },
              }
            : old
      );

      return { previousWorkspace };
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.data.ai.enabled
          ? "AI integration enabled"
          : "AI integration disabled"
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.workspaceId),
      });
      enableForm.reset({ ai: { enabled: enableForm.getValues("ai.enabled") } });
      router.refresh();
    },
    onError: (error, _variables, context) => {
      if (context?.previousWorkspace && _variables?.workspaceId) {
        queryClient.setQueryData(
          QUERY_KEYS.WORKSPACE(_variables.workspaceId),
          context.previousWorkspace
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update AI settings";
      toast.error(errorMessage);
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WORKSPACE(variables.workspaceId),
        });
      }
    },
  });

  const onEnableSubmit = (data: AiEnableValues) => {
    if (!isOwner || !activeWorkspace?.id) {
      return;
    }
    updateAiSettings({
      workspaceId: activeWorkspace.id,
      data,
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
                checked={enableForm.watch("ai.enabled")}
                disabled={!isOwner}
                id={enableId}
                onCheckedChange={(checked) =>
                  enableForm.setValue("ai.enabled", checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>
            {enableForm.formState.errors.ai?.enabled && (
              <p className="text-destructive text-xs">
                {enableForm.formState.errors.ai.enabled.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-muted-foreground text-sm">
            {enableForm.watch("ai.enabled")
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
