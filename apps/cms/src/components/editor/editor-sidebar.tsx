"use client";

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
import type { EditorInstance } from "novel";
import { useEffect, useState } from "react";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import { useReadability } from "@/hooks/use-readability";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { AsyncButton } from "../ui/async-button";
import { Gauge } from "../ui/gauge";
import { AttributionField } from "./fields/attribution-field";
import { AuthorSelector } from "./fields/author-selector";
import { CategorySelector } from "./fields/category-selector";
import { CoverImageSelector } from "./fields/cover-image-selector";
import { DescriptionField } from "./fields/description-field";
import { PublishDateField } from "./fields/publish-date-field";
import { SlugField } from "./fields/slug-field";
import { StatusField } from "./fields/status-field";
import { TagSelector } from "./fields/tag-selector";
import { HiddenScrollbar } from "./hidden-scrollbar";

interface EditorSidebarProps extends React.ComponentProps<typeof Sidebar> {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
  watch: UseFormWatch<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
  isSubmitting: boolean;
  defaultCoverImage?: string | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
  editor?: EditorInstance | null;
}

export function EditorSidebar({
  control,
  errors,
  formRef,
  isSubmitting,
  watch,
  isOpen,
  setIsOpen,
  mode = "create",
  editor,
  ...props
}: EditorSidebarProps) {
  const { open } = useSidebar();
  const hasErrors = Object.keys(errors).length > 0;
  const { tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState("metadata");
  const [editorText, setEditorText] = useState("");

  useEffect(() => {
    if (!editor) {
      return;
    }
    setEditorText(editor.getText());
    const handler = () => setEditorText(editor.getText());
    editor.on("update", handler);
    editor.on("create", handler);
    return () => {
      editor.off("update", handler);
      editor.off("create", handler);
    };
  }, [editor]);

  const textMetrics = useReadability({ editor, text: editorText });

  const triggerSubmit = async () => {
    if (hasErrors) {
      console.log("hasErrors", errors);
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div>
      <Sidebar
        className={cn(
          "m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-editor-sidebar-background",
          open ? "" : "mr-0"
        )}
        side="right"
        {...props}
      >
        <SidebarHeader className="sticky top-0 z-10 shrink-0 bg-transparent px-6 py-4">
          <Tabs
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="flex justify-start gap-2" variant="line">
              <TabsTrigger className="px-2" value="metadata">
                Metadata
              </TabsTrigger>
              <TabsTrigger className="px-2" value="analysis">
                Analysis
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-hidden bg-transparent">
          <Tabs
            className="flex h-full flex-col"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsContent
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
              value="metadata"
            >
              <HiddenScrollbar className="h-full px-6">
                <section className="grid gap-6 pt-4 pb-5">
                  <StatusField control={control} />

                  <Separator className="flex" orientation="horizontal" />

                  <CoverImageSelector control={control} />

                  <DescriptionField control={control} />

                  <SlugField control={control} />

                  <AuthorSelector
                    control={control}
                    defaultAuthors={initialAuthors || []}
                  />

                  <TagSelector control={control} defaultTags={tags || []} />

                  <CategorySelector control={control} />

                  <PublishDateField control={control} />

                  <Separator className="mt-4 flex" orientation="horizontal" />

                  <AttributionField control={control} errors={errors} />
                </section>
              </HiddenScrollbar>
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
              value="analysis"
            >
              <HiddenScrollbar className="h-full px-6">
                <section className="grid gap-6 pt-4 pb-5">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Readability</h4>
                      <div className="flex items-center justify-center">
                        <Gauge
                          animate={true}
                          label="Score"
                          size={200}
                          value={textMetrics.readabilityScore}
                        />
                      </div>
                      {textMetrics.wordCount > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">Feedback</h5>
                          <p className="text-muted-foreground text-xs">
                            <span className="font-medium">
                              {textMetrics.readabilityLevel.level}:
                            </span>{" "}
                            {textMetrics.readabilityLevel.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Text Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Words</p>
                          <p className="font-medium">{textMetrics.wordCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Sentences</p>
                          <p className="font-medium">
                            {textMetrics.sentenceCount}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            Words per Sentence
                          </p>
                          <p className="font-medium">
                            {textMetrics.wordsPerSentence}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Reading Time</p>
                          <p className="font-medium">
                            {textMetrics.readingTime.toFixed(0)} minutes
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        {textMetrics.wordCount === 0
                          ? "Getting Started"
                          : "Suggestions"}
                      </h4>
                      <div className="space-y-2 text-muted-foreground text-sm">
                        {textMetrics.suggestions.map((suggestion) => (
                          <p key={suggestion}>• {suggestion}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </HiddenScrollbar>
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="shrink-0 bg-transparent px-6 py-6">
          {activeTab === "metadata" &&
            (mode === "create" ? (
              <AsyncButton
                className="w-full"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                type="button"
              >
                Save
              </AsyncButton>
            ) : (
              <AsyncButton
                className="w-full"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                type="button"
              >
                Update
              </AsyncButton>
            ))}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
