"use client";

import type { PostValues } from "@/lib/validations/post";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { Loader2 } from "@marble/ui/lib/icons";

import { Separator } from "@marble/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import { ButtonLoader } from "../ui/loader";
import { AttributionField } from "./fields/attribution-field";
import { AuthorSelector } from "./fields/author-selector";
import { CategorySelector } from "./fields/category-selector";
import { CoverImageSelector } from "./fields/cover-image-selector";
import { DescriptionField } from "./fields/description-field";
import { PublishDateField } from "./fields/publish-date-field";
import { SlugField } from "./fields/slug-field";
import StatusField from "./fields/status-field";
import { TagSelector } from "./fields/tag-selector";
import HiddenScrollbar from "./hidden-scrollbar";
import { useUnsavedChanges } from "@/providers/unsaved-changes";

interface EditorSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export function EditorSidebar({
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
  trigger,
  mode = "create",
  ...props
}: EditorSidebarProps) {
  const { open } = useSidebar();
  const hasErrors = Object.keys(errors).length > 0;
  const { status, tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();

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
    <div className="">
      <Sidebar
        // variant="inset"
        side="right"
        className={cn(
          "bg-sidebar m-2 py-6 rounded-xl shadow-sm border h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-y-hidden",
          !open ? "mr-0" : "",
        )}
        {...props}
      >
        {/* <SidebarHeader className="bg-background px-8"></SidebarHeader> */}
        <SidebarContent className="bg-sidebar">
          <HiddenScrollbar className="px-6">
            <section className="grid gap-6 pb-5">
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
          </HiddenScrollbar>
        </SidebarContent>
        <SidebarFooter className="bg-sidebar px-6 py-0">
          {mode === "create" ? (
            <Button
              type="button"
              disabled={isSubmitting || !hasUnsavedChanges}
              onClick={triggerSubmit}
              className="mt-4 min-w-32"
            >
              {isSubmitting ? (
                <ButtonLoader className="size-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting || !hasUnsavedChanges}
              onClick={triggerSubmit}
              className="mt-4 min-w-32"
            >
              {isSubmitting ? (
                <ButtonLoader className="size-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
