"use client";

import {
  checkWorkspaceSlug,
  updateWorkspaceAction,
} from "@/lib/actions/workspace";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWorkspace } from "../providers/workspace";

const workspaceFormSchema = z.object({
  name: z.string().min(4, { message: "Name must be at least 4 letters" }),
  slug: z.string().min(4, { message: "Slug must be at least 4 letters" }),
});
type WorkspaceData = z.infer<typeof workspaceFormSchema>;

interface WorkspaceFormProps {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}

function WorkspaceForm({ name, slug, id }: WorkspaceFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: name || "",
      slug: slug || "",
    },
  });

  const onSubmit = async (data: WorkspaceData) => {
    try {
      if (!id) return;

      const isAvailable = await checkWorkspaceSlug(data.slug, id);
      if (!isAvailable) {
        setError("slug", {
          message: "Slug is already taken",
        });
        return;
      }

      const updatedWorkspace = await updateWorkspaceAction(id, data);
      router.replace(`/${updatedWorkspace.slug}/settings`);
      router.refresh(); // Refresh the page to get updated data from server
    } catch (error) {
      console.error(error);
      // Handle error appropriately
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="Technology" />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register("slug")} placeholder="workspace" />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>
        <Button
          disabled={isSubmitting}
          className="w-fit self-end flex gap-2 items-center"
        >
          {isSubmitting && <Loader2 className="animate-spin size-4" />}
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}

export default WorkspaceForm;
