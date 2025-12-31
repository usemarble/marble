"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
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
    <Card className="rounded-[20px] border-none bg-sidebar p-2">
      <form
        className="flex flex-col"
        onSubmit={enableForm.handleSubmit(onEnableSubmit)}
      >
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="font-medium text-lg">AI Features</CardTitle>
            <CardDescription>
              Enable AI-powered readability insights and suggestions
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between">
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
        </div>
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-muted-foreground text-sm">
            {enableForm.watch("ai.enabled")
              ? "AI features are enabled"
              : "AI features are disabled"}
          </p>
          <AsyncButton
            className={cn("flex w-20 items-center gap-2 self-end")}
            disabled={!isOwner || !enableForm.formState.isDirty}
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
