"use client";

import {
  checkWorkspaceSlug,
  updateWorkspaceAction,
} from "@/lib/actions/workspace";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const nameSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Name must be at least 4 letters" })
    .max(32),
});

const slugSchema = z.object({
  slug: z
    .string()
    .min(4, { message: "Slug must be at least 4 letters" })
    .max(32),
});

type NameData = z.infer<typeof nameSchema>;
type SlugData = z.infer<typeof slugSchema>;

interface WorkspaceFormProps {
  id: string;
  name: string;
  slug: string;
}

function WorkspaceForm({ name, slug, id }: WorkspaceFormProps) {
  const router = useRouter();
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSlugChanged, setIsSlugChanged] = useState(false);

  const nameForm = useForm<NameData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: name || "" },
  });

  const slugForm = useForm<SlugData>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: slug || "" },
  });

  useEffect(() => {
    const nameSubscription = nameForm.watch((value) => {
      setIsNameChanged(value.name !== name);
    });
    const slugSubscription = slugForm.watch((value) => {
      setIsSlugChanged(value.slug !== slug);
    });

    return () => {
      nameSubscription.unsubscribe();
      slugSubscription.unsubscribe();
    };
  }, [nameForm.watch, slugForm.watch, name, slug]);

  const onNameSubmit = async (data: NameData) => {
    try {
      if (!id) return;
      const updatedWorkspace = await updateWorkspaceAction(id, {
        ...data,
        slug,
      });
      toast.success("Workspace name updated.", { position: "bottom-center" });
      router.refresh();
      setIsNameChanged(false);
    } catch (error) {
      toast.error("Failed to update.", { position: "bottom-center" });
    }
  };

  const onSlugSubmit = async (data: SlugData) => {
    if (!id) return;

    try {
      const slugExists = await checkWorkspaceSlug(data.slug, id);
      if (slugExists) {
        slugForm.setError("slug", { message: "Slug is already taken" });
        return;
      }

      const updatedWorkspace = await updateWorkspaceAction(id, {
        ...data,
        name,
      });
      toast.success("Workspace slug updated.", { position: "bottom-center" });
      router.replace(`/${updatedWorkspace.slug}/settings`);
      router.refresh();
      setIsSlugChanged(false);
    } catch (error) {
      toast.error("Failed to update.", { position: "bottom-center" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Name</CardTitle>
          <CardDescription>The name of your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="flex flex-col gap-2 w-full"
          >
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="name" className="sr-only">
                  Name
                </Label>
                <Input
                  id="name"
                  {...nameForm.register("name")}
                  placeholder="Technology"
                />
              </div>
              <Button
                disabled={!isNameChanged || nameForm.formState.isSubmitting}
                className={cn("w-20 self-end flex gap-2 items-center")}
              >
                {nameForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Slug</CardTitle>
          <CardDescription>Your unique workspace slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={slugForm.handleSubmit(onSlugSubmit)}
            className="flex flex-col gap-2 w-full"
          >
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="slug" className="sr-only">
                  Slug
                </Label>
                <Input
                  id="slug"
                  {...slugForm.register("slug")}
                  placeholder="workspace"
                />
              </div>
              <Button
                disabled={!isSlugChanged || slugForm.formState.isSubmitting}
                className={cn("w-20 self-end flex gap-2 items-center")}
              >
                {slugForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
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
    </div>
  );
}

export default WorkspaceForm;
