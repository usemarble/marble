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

      return await organization.update({
        organizationId,
        data: {
          slug: payload.slug,
        },
      });
    },
    onSuccess: (data, variables) => {
      if (!data) return;

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
    if (!isOwner || !activeWorkspace?.id) return;
    const cleanSlug = generateSlug(payload.slug);
    updateSlug({
      organizationId: activeWorkspace.id,
      payload: { slug: cleanSlug },
    });
  };

  return (
    <Card className="pb-4">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Workspace Slug</CardTitle>
        <CardDescription>Your unique workspace slug.</CardDescription>
      </CardHeader>
      <form
        onSubmit={slugForm.handleSubmit(onSlugSubmit)}
        className="flex flex-col gap-6"
      >
        <CardContent>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor={slugId} className="sr-only">
                  Slug
                </Label>
                <Input
                  id={slugId}
                  {...slugForm.register("slug")}
                  placeholder="workspace"
                  disabled={!isOwner}
                />
              </div>
            </div>
            {slugForm.formState.errors.slug && (
              <p className="text-xs text-destructive">
                {slugForm.formState.errors.slug.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Used in your workspace URL
          </p>
          <AsyncButton
            isLoading={isPending}
            disabled={!isOwner || !slugForm.formState.isDirty}
            className={cn("w-20 self-end flex gap-2 items-center")}
          >
            Save
          </AsyncButton>
        </CardFooter>
      </form>
    </Card>
  );
}
