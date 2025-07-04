"use client";

import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import { useState } from "react";
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
import { useUnsavedChanges } from "@/providers/unsaved-changes";
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
  const { tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState("metadata");

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

  const handleAnalyzeContent = () => {
    toast.info("Content analysis coming soon!");
  };

  return (
    <div className="">
      <Sidebar
        side="right"
        className={cn(
          "bg-sidebar m-2 rounded-xl shadow-sm border h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden",
          !open ? "mr-0" : "",
        )}
        {...props}
      >
        {/* Sticky Header with Tab Triggers */}
        <SidebarHeader className="bg-sidebar px-6 py-2 flex-shrink-0 sticky top-0 z-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList variant="underline" className="flex justify-start gap-4">
              <TabsTrigger
                variant="underline"
                value="metadata"
                className="px-0"
              >
                Metadata
              </TabsTrigger>
              <TabsTrigger
                variant="underline"
                value="analysis"
                className="px-0"
              >
                Analysis
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarHeader>

        {/* Scrollable Content with Tab Contents */}
        <SidebarContent className="bg-sidebar flex-1 min-h-0 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            {/* Metadata Tab Content */}
            <TabsContent
              value="metadata"
              className="flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <HiddenScrollbar className="px-6 h-full">
                <section className="grid gap-6 pb-5 pt-4">
                  <StatusField watch={watch} setValue={setValue} />

                  <Separator orientation="horizontal" className="flex" />

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
            </TabsContent>

            {/* Analysis Tab Content */}
            <TabsContent
              value="analysis"
              className="flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <HiddenScrollbar className="px-6 h-full">
                <section className="grid gap-6 pb-5 pt-4">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Readability Score</h3>
                      <div className="text-2xl font-bold text-green-600">
                        85
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Good readability for general audience
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Suggestions</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Consider shorter sentences</p>
                        <p>• Use more common words</p>
                        <p>• Add subheadings to break up content</p>
                      </div>
                    </div>
                  </div>
                </section>
              </HiddenScrollbar>
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="bg-sidebar px-6 py-6  flex-shrink-0">
          {activeTab === "metadata" ? (
            mode === "create" ? (
              <Button
                type="button"
                disabled={isSubmitting || !hasUnsavedChanges}
                onClick={triggerSubmit}
                className="w-full"
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
                className="w-full"
              >
                {isSubmitting ? (
                  <ButtonLoader className="size-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            )
          ) : (
            <Button className="w-full" onClick={handleAnalyzeContent}>
              Analyze Content
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
