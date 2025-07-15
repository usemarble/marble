"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import {
  checkWorkspaceSlug,
  createWorkspaceAction,
} from "@/lib/actions/workspace";
import { timezones } from "@/lib/constants";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { useWorkspace } from "../../providers/workspace";
import { ButtonLoader } from "../ui/loader";
import { TimezoneSelector } from "../ui/timezone-selector";

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
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

      const workspace = await createWorkspaceAction({
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
      });

      if (workspace) {
        await updateActiveWorkspace(workspace.slug);
        setOpen(false);
        router.push(`/${workspace.slug}`);
      }
    } catch (_error) {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            New workspace
          </DialogTitle>
          <DialogDescription className="sr-only">
            A Workspace is a way for you to manage multiple blogs and
            collaborate with teammates.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mt-6"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name" className="sr-only">
              Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              autoComplete="off"
              placeholder="Name"
            />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug" className="sr-only">
              Slug
            </Label>
            <div className="flex w-full rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
              <span className="py-2.5 px-2 bg-muted border-r">
                {process.env.NEXT_PUBLIC_APP_URL?.split("//")[1]}/
              </span>
              <input
                id="slug"
                {...register("slug")}
                defaultValue={generateSlug(name)}
                placeholder="slug"
                className="w-full bg-transparent py-2 outline-none ring-0 pl-2"
              />
            </div>
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="timezone" className="sr-only">
              Timezone
            </Label>
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <TimezoneSelector
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select timezone..."
                  timezones={timezones}
                />
              )}
            />
            {errors.timezone && (
              <ErrorMessage>{errors.timezone.message}</ErrorMessage>
            )}
          </div>
          <div className="mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full gap-2"
            >
              {isSubmitting ? <ButtonLoader /> : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
