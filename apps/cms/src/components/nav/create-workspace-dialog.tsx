"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { AsyncButton } from "@/components/ui/async-button";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { organization } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";

type CreateWorkspaceDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CreateWorkspaceDialog = (props: CreateWorkspaceDialogProps) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const { name } = watch();

  useEffect(() => {
    if (name) {
      const slug = generateSlug(name);
      setValue("slug", slug);
    }
  }, [name, setValue]);

  async function onSubmit(payload: CreateWorkspaceValues) {
    const { error } = await organization.checkSlug({
      slug: payload.slug,
    });

    if (error) {
      toast.error(error.message ?? "Failed to check slug");
      return;
    }

    try {
      const { data, error } = await organization.create({
        name: payload.name,
        slug: payload.slug,
        timezone: payload.timezone,
        logo: `https://api.dicebear.com/9.x/glass/svg?seed=${payload.name}`,
      });

      if (error) {
        toast.error(error.message ?? "Failed to create workspace");
        return;
      }

      if (data) {
        await organization.setActive({
          organizationId: data.id,
        });
        props.setOpen(false);
        reset();
        router.push(`/${data.slug}`);
        toast.success("Workspace created");
      }
    } catch (error) {
      console.error("Failed to create workspace", error);
      toast.error("Failed to create workspace");
    }
  }

  return (
    <Dialog onOpenChange={props.setOpen} open={props.open}>
      <DialogContent className="p-8 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Create Workspace
          </DialogTitle>
          <DialogDescription className="text-center">
            Set up your new workspace.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input id="name" placeholder="Name" {...register("name")} />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>

          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="slug">
              Slug
            </Label>
            <div className="flex w-full overflow-hidden rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30">
              <span className="border-r bg-muted p-2">
                {process.env.NEXT_PUBLIC_APP_URL?.split("//")[1]}/
              </span>
              <input
                id="slug"
                placeholder="Slug"
                {...register("slug")}
                autoComplete="off"
                className="w-full bg-transparent px-2 py-2 outline-none ring-0"
              />
            </div>
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="sr-only" htmlFor="timezone">
              Timezone
            </Label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <TimezoneSelector
                  onValueChange={field.onChange}
                  placeholder="Select timezone..."
                  timezones={timezones}
                  value={field.value}
                />
              )}
            />
            {errors.timezone && (
              <ErrorMessage>{errors.timezone.message}</ErrorMessage>
            )}
          </div>

          <AsyncButton
            className="mt-4 flex w-full gap-2"
            isLoading={isSubmitting}
            type="submit"
          >
            Create
          </AsyncButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};
