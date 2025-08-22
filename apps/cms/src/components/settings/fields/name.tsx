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
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type NameValues, nameSchema } from "@/lib/validations/workspace";
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
    mutationFn: async (data: NameValues) => {
      return await organization.update({
        // biome-ignore lint/style/noNonNullAssertion: <>
        organizationId: activeWorkspace?.id!,
        data: {
          name: data.name,
        },
      });
    },
    onSuccess: () => {
      toast.success("Workspace name updated");
      nameForm.reset({ name: nameForm.getValues("name") });
      queryClient.invalidateQueries({
        // biome-ignore lint/style/noNonNullAssertion: <>
        queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace?.id!),
      });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update";
      toast.error(errorMessage);
    },
  });

  const onNameSubmit = (data: NameValues) => {
    // need to work on proper permissons later
    if (!isOwner) return;
    updateName(data);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Workspace Name</CardTitle>
        <CardDescription>The name of your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={nameForm.handleSubmit(onNameSubmit)}
          className="flex flex-col gap-2 w-full"
        >
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor={nameId} className="sr-only">
                Name
              </Label>
              <Input
                id={nameId}
                {...nameForm.register("name")}
                placeholder="Technology"
                disabled={!isOwner}
              />
            </div>
            <Button
              disabled={!isOwner || !nameForm.formState.isDirty || isPending}
              className={cn("w-20 self-end flex gap-2 items-center")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
          </div>
          {nameForm.formState.errors.name && (
            <p className="text-xs text-destructive">
              {nameForm.formState.errors.name.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
