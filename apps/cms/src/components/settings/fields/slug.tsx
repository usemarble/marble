"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type SlugValues, slugSchema } from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";
import { generateSlug } from "@/utils/string";

export function Slug() {
  const router = useRouter();
  const { activeWorkspace, isOwner } = useWorkspace();
  const queryClient = useQueryClient();
  const slugId = useId();
  const slugForm = useForm<SlugValues>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: activeWorkspace?.slug || "" },
  });

  const { mutate: updateSlug, isPending } = useMutation({
    mutationFn: async ({
      organizationId,
      payload,
    }: {
      organizationId: string;
      payload: SlugValues;
    }) => {
      const { data, error } = await organization.checkSlug({
        slug: payload.slug,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.status) {
        slugForm.setError("slug", { message: "Slug is already taken" });
        throw new Error("Slug is already taken");
      }

      const res = await organization.update({
        organizationId,
        data: {
          slug: payload.slug,
        },
      });
      if (res?.error) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (data, variables) => {
      if (!data) {
        return;
      }

      toast.success("Workspace slug updated");
      slugForm.reset({ slug: data.data?.slug });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
      });
      router.replace(`/${data.data?.slug}/settings/general`);
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update workspace slug";
      if (errorMessage !== "Slug is already taken") {
        toast.error(errorMessage);
        console.error("Failed to update workspace slug:", error);
      }
    },
  });

  const onSlugSubmit = (payload: SlugValues) => {
    if (!isOwner || !activeWorkspace?.id) {
      return;
    }
    const cleanSlug = generateSlug(payload.slug);
    updateSlug({
      organizationId: activeWorkspace.id,
      payload: { slug: cleanSlug },
    });
  };

  return (
    <Card className="rounded-[20px] border-none bg-sidebar p-2">
      <form
        className="flex flex-col"
        onSubmit={slugForm.handleSubmit(onSlugSubmit)}
      >
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="font-medium text-lg">
              Workspace Slug
            </CardTitle>
            <CardDescription>Your unique workspace slug.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="sr-only" htmlFor={slugId}>
                  Slug
                </Label>
                <Input
                  id={slugId}
                  {...slugForm.register("slug")}
                  disabled={!isOwner}
                  placeholder="workspace"
                />
              </div>
            </div>
            {slugForm.formState.errors.slug && (
              <p className="text-destructive text-xs">
                {slugForm.formState.errors.slug.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-muted-foreground text-sm">
            Used in your workspace URL
          </p>
          <AsyncButton
            className={cn("flex w-20 items-center gap-2 self-end")}
            disabled={!isOwner || !slugForm.formState.isDirty}
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
