"use client";

import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Loader2, SettingsIcon } from "@marble/ui/lib/icons";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { AttributionField } from "./fields/attribution-field";
import { AuthorSelector } from "./fields/author-selector";
import { CategorySelector } from "./fields/category-selector";
import { CoverImageSelector } from "./fields/cover-image-selector";
import { DescriptionField } from "./fields/description-field";
import { PublishDateField } from "./fields/publish-date-field";
import { SlugField } from "./fields/slug-field";
import { StatusField } from "./fields/status-field";
import { TagSelector } from "./fields/tag-selector";

interface PublishSettingsProps {
  control: Control<PostValues>;
  register: UseFormRegister<PostValues>;
  setValue: UseFormSetValue<PostValues>;
  clearErrors: UseFormClearErrors<PostValues>;
  errors: FieldErrors<PostValues>;
  trigger: UseFormTrigger<PostValues>;
  watch: UseFormWatch<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
  isSubmitting: boolean;
  defaultCoverImage?: string | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
}

export function PublishSettings({
  control,
  register,
  setValue,
  errors,
  formRef,
  isSubmitting,
  watch,
  isOpen,
  setIsOpen,
  clearErrors,
  mode = "create",
}: PublishSettingsProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const { status, tags, authors: initialAuthors } = watch();

  // Trigger form submit
  const triggerSubmit = async () => {
    if (hasErrors) {
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="group">
            <SettingsIcon className="size-4 text-muted-foreground group-hover:text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent className="h-[97%] right-3 top-3 border rounded-md overflow-y-auto min-w-[420px]">
          <SheetHeader>
            <SheetTitle>Publish settings</SheetTitle>
            <SheetDescription className="sr-only">
              Setup article metadata.
            </SheetDescription>
          </SheetHeader>
          <section className="grid gap-6 py-6">
            <StatusField watch={watch} setValue={setValue} />

            <Separator orientation="horizontal" className=" flex" />

            <CoverImageSelector setValue={setValue} watch={watch} />

            <DescriptionField register={register} errors={errors} />

            <SlugField register={register} errors={errors} />

            <AuthorSelector
              control={control}
              defaultAuthors={initialAuthors || []}
            />

            <TagSelector control={control} defaultTags={tags || []} />

            <CategorySelector
              control={control}
              errors={errors}
              setValue={setValue}
              clearErrors={clearErrors}
            />

            <PublishDateField watch={watch} setValue={setValue} />

            <Separator orientation="horizontal" className="flex mt-4" />

            <AttributionField
              watch={watch}
              setValue={setValue}
              errors={errors}
            />
          </section>
          <SheetFooter>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={triggerSubmit}
              className="mt-4 min-w-32"
            >
              {isSubmitting && status === "published" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : status === "published" ? (
                mode === "create" ? (
                  "Save & Publish"
                ) : (
                  "Save & Update"
                )
              ) : (
                "Save as Draft"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
