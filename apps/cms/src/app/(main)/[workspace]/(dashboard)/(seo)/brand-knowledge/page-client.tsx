"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { GearIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type BrandKnowledgeWebsiteValues,
  brandKnowledgeWebsiteSchema,
} from "@/lib/validations/seo";

type BrandKnowledgeDescription =
  | {
      status: "crawling";
    }
  | {
      status: "summarizing";
    }
  | {
      status: "completed";
      summary: string;
    }
  | {
      status: "error";
      error: string;
    };

type BrandKnowledgeWebsite = {
  id: string;
  url: string;
  description: BrandKnowledgeDescription | null;
  createdAt: string;
  updatedAt: string;
};

export function BrandKnowledgeWebsiteSheet() {
  const [open, setOpen] = useState(false);

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandKnowledgeWebsiteValues>({
    resolver: zodResolver(brandKnowledgeWebsiteSchema),
    defaultValues: {
      websiteUrl: "",
    },
  });

  const { mutate: saveWebsite, isPending } = useMutation({
    mutationFn: async (data: BrandKnowledgeWebsiteValues) => {
      const res = await fetch("/api/ai/brand-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save website");
      }

      const responseData = (await res.json()) as { website: BrandKnowledgeWebsite };
      return responseData;
    },
    onSuccess: () => {
      toast.success("Website linked successfully");
      reset();
      setOpen(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId),
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to save website";
      toast.error(message);
    },
  });

  const onSubmit = (data: BrandKnowledgeWebsiteValues) => {
    saveWebsite(data);
  };

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)} type="button">
        <LinkSimpleIcon className="size-4" />
        Link website
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-medium">
              Link your website
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add your website URL so Marble can learn about your brand.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-2 flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                placeholder="https://your-website.com"
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-destructive text-sm">
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <AsyncButton
                className="w-full"
                isLoading={isPending}
                type="submit"
              >
                Save website
              </AsyncButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PageClient() {
  const workspaceId = useWorkspaceId();

  const { data, isLoading } = useQuery<{
    website: BrandKnowledgeWebsite | null;
  }>({
    // biome-ignore lint/style/noNonNullAssertion: workspaceId is required when enabled is true
    queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/ai/brand-knowledge");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load brand knowledge");
        }
        return (await res.json()) as { website: BrandKnowledgeWebsite | null };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load brand knowledge";
        toast.error(message);
        throw error;
      }
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const website = data?.website;
  const description = website?.description;

  const statusLabel =
    description?.status === "crawling"
      ? "Crawling website"
      : description?.status === "summarizing"
        ? "Summarizing content"
        : description?.status === "error"
          ? "Error"
          : description?.status === "completed"
            ? "Ready"
            : "Not configured";

  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      {!website ? (
        <div className="flex max-w-80 flex-col items-center gap-4">
          <div className="p-2">
            <GearIcon className="size-16" />
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Configure your brand knowledge settings to improve SEO and content
              quality.
            </p>
            <BrandKnowledgeWebsiteSheet />
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Website
              </p>
              <p className="text-sm font-medium">{website.url}</p>
            </div>
            <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
              {statusLabel}
            </span>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Brand summary
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {description?.status === "completed" && description.summary
                ? description.summary
                : description?.status === "error" && description.error
                  ? description.error
                  : "We are analyzing your website. This usually takes a few moments."}
            </p>
          </div>
        </div>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
