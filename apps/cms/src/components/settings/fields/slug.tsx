"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { generateSlug } from "@marble/utils";
import { type SlugValues, slugSchema } from "@marble/utils/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { organization } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
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
    onSuccess: (data) => {
      if (!data) {
        return;
      }

      toast.success("Workspace slug updated");
      slugForm.reset({ slug: data.data?.slug });
      queryClient.invalidateQueries({
        queryKey: orpc.workspaces.list.key(),
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
    <SettingsSection
      description="Your unique workspace slug. Used in your workspace URL."
      title="Workspace Slug"
    >
      <form
        className="flex flex-col gap-2 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-start"
        onSubmit={slugForm.handleSubmit(onSlugSubmit)}
      >
        <div className="min-w-0 flex-1">
          <Label className="sr-only" htmlFor={slugId}>
            Slug
          </Label>
          <Input
            id={slugId}
            {...slugForm.register("slug")}
            disabled={!isOwner}
            placeholder="workspace"
          />
          {slugForm.formState.errors.slug && (
            <ErrorMessage>
              {slugForm.formState.errors.slug.message}
            </ErrorMessage>
          )}
        </div>
        <AsyncButton
          className="w-20 self-end"
          disabled={!isOwner || !slugForm.formState.isDirty}
          isLoading={isPending}
          type="submit"
        >
          Save
        </AsyncButton>
      </form>
    </SettingsSection>
  );
}
