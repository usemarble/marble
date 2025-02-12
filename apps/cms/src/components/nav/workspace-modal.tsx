"use client";

import { Loader } from "@repo/ui/lib/icons";
import { useEffect } from "react";

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
import { checkWorkspaceSlug } from "@/lib/actions/workspace";
import { organization } from "@/lib/auth/client";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/generate-slug";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@repo/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useWorkspace } from "../context/workspace";

export const CreateWorkspaceModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { updateActiveWorkspace } = useWorkspace();
  const {
    watch,
    setError,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
  });
  const router = useRouter();
  const { name } = watch();

  useEffect(() => {
    if (name) {
      const slug = generateSlug(name);
      setValue("slug", slug);
    }
  }, [name, setValue]);

  const onSubmit = async (data: CreateWorkspaceValues) => {
    try {
      const slugExists = await checkWorkspaceSlug(data.slug);
      if (slugExists) {
        setError("slug", { message: "This slug is in use" });
        return;
      }

      const response = await organization.create({
        name: data.name,
        slug: data.slug,
        logo: `https://api.dicebear.com/9.x/glass/svg?seed=${data.name}`,
      });

      if (response.data) {
        const transformedData = {
          ...response.data,
          members: response.data.members.map((member) => ({
            ...member,
            id: member.id || member.userId, // Ensure id is always present
          })),
        };
        await updateActiveWorkspace(response.data.slug, transformedData);
        setOpen(false);
        router.push(`/${response.data.slug}`);
      }
    } catch (error) {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription className="sr-only">
            A Workspace is a way for you to manage multiple blogs and
            collaborate with teammates.
          </DialogDescription>
        </DialogHeader>
        {/*  */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} autoComplete="off" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex w-full rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
              <span className="py-2.5 px-2 bg-muted border-r">
                app.marblecms.com/
              </span>
              <input
                id="slug"
                {...register("slug")}
                defaultValue={generateSlug(name)}
                className="w-full bg-transparent py-2 outline-none ring-0 pl-2"
              />
            </div>
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <div className="mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full gap-2"
            >
              {isSubmitting && <Loader className="size-4 animate-spin" />}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
