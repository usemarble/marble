"use client";

import { Loader } from "@repo/ui/lib/icons";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";

import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

import { ErrorMessage } from "@/components/auth/error-message";
import { createSiteAction } from "@/lib/actions/site";
import { type CreateSiteValues, siteSchema } from "@/lib/validations/site";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export const CreateSiteModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSiteValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: "", description: "" },
  });
  const router = useRouter();
  const { workspace } = useParams();
  // Ensure `workspace` is a string
  const workspaceSlug = Array.isArray(workspace) ? workspace[0] : workspace;

  const onSubmit = async (data: CreateSiteValues) => {
    try {
      await createSiteAction(data, workspaceSlug as string).then((res) =>
        router.push(`./${res.id}`),
      );
      setOpen(false);
      toast.success("Site created successfully");
    } catch (error) {
      toast.error("Failed to create site");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new site</DialogTitle>
          <DialogDescription>
            A Site is simply a blog or a website that you can manage within a
            workspace.
          </DialogDescription>
        </DialogHeader>
        {/*  */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Site name</Label>
            <Input id="name" {...register("name")} autoComplete="off" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description">Site description</Label>
            <Textarea
              id="description"
              placeholder="My cool business workspace"
              {...register("description")}
              className="resize-none"
            />
            {errors.description && (
              <ErrorMessage>{errors.description.message}</ErrorMessage>
            )}
          </div>
          <div className="mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full gap-2"
            >
              {isSubmitting && <Loader className="size-4 animate-spin" />}
              Create Site
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
