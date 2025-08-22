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
import { type SlugValues, slugSchema } from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";

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
    mutationFn: async (payload: SlugValues) => {
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
        // biome-ignore lint/style/noNonNullAssertion: <>
        organizationId: activeWorkspace?.id!,
        data: {
          slug: payload.slug,
        },
      });
    },
    onSuccess: (data) => {
      if (!data) return;

      toast.success("Workspace slug updated");
      slugForm.reset({ slug: data.data?.slug });
      queryClient.invalidateQueries({
        // biome-ignore lint/style/noNonNullAssertion: <>
        queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace?.id!),
      });
      router.replace(`/${data.data?.slug}/settings/general`);
      router.refresh();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update";
      if (errorMessage !== "Slug is already taken") {
        toast.error(errorMessage);
      }
    },
  });

  const onSlugSubmit = (payload: SlugValues) => {
    if (!isOwner || !activeWorkspace?.id) return;
    updateSlug(payload);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Workspace Slug</CardTitle>
        <CardDescription>Your unique workspace slug.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={slugForm.handleSubmit(onSlugSubmit)}
          className="flex flex-col gap-2 w-full"
        >
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
            <Button
              disabled={!isOwner || !slugForm.formState.isDirty || isPending}
              className={cn("w-20 self-end flex gap-2 items-center")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
          </div>
          {slugForm.formState.errors.slug && (
            <p className="text-xs text-destructive">
              {slugForm.formState.errors.slug.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
