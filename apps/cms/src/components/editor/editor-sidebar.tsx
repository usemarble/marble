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
import { useEditor } from "novel";
import { useMemo, useState } from "react";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import {
  calculateReadabilityScore,
  generateSuggestions,
  getReadabilityLevel,
} from "@/utils/readability";
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
  ...props
}: EditorSidebarProps) {
  const { open } = useSidebar();
  const { editor } = useEditor();
  const hasErrors = Object.keys(errors).length > 0;
  const { tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState("metadata");

  const textMetrics = useMemo(() => {
    console.log("editor", editor?.getText());
    const inputText = editor?.getText();

    if (!editor || !inputText)
      return {
        wordCount: 0,
        sentenceCount: 0,
        avgWordsPerSentence: 0,
        readabilityScore: 0,
        readabilityLevel: { level: "Unknown", description: "Unknown" },
        suggestions: [],
      };
    console.log("editor?.storage", editor.storage.characterCount);
    const wordCountResult = editor.storage.characterCount.words();

    const sentences = inputText
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0);
    const sentenceCount = sentences.length;

    const avgWordsPerSentence =
      sentenceCount > 0 ? Math.round(wordCountResult / sentenceCount) : 0;
    const readabilityScore = calculateReadabilityScore(editor);
    const readabilityLevel = getReadabilityLevel(readabilityScore);

    const metrics = {
      wordCount: wordCountResult,
      sentenceCount,
      avgWordsPerSentence,
      readabilityScore,
      readabilityLevel,
    };

    const suggestions = generateSuggestions(metrics);

    return {
      ...metrics,
      readabilityLevel,
      suggestions,
    };
  }, [editor]);

  const triggerSubmit = async () => {
    if (hasErrors) {
      console.log("hasErrors", errors);
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
    <div>
      <Sidebar
        side="right"
        className={cn(
          "bg-editor-sidebar-background m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border",
          !open ? "mr-0" : "",
        )}
        {...props}
      >
        <SidebarHeader className="bg-transparent sticky top-0 z-10 shrink-0 px-6 py-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList variant="line" className="flex justify-start gap-2">
              <TabsTrigger value="metadata" className="px-2">
                Metadata
              </TabsTrigger>
              <TabsTrigger value="analysis" className="px-2">
                Analysis
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarHeader>

        <SidebarContent className="bg-transparent min-h-0 flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <TabsContent
              value="metadata"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <HiddenScrollbar className="h-full px-6">
                <section className="grid gap-6 pb-5 pt-4">
                  <StatusField control={control} />

                  <Separator orientation="horizontal" className="flex" />

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

                  <Separator orientation="horizontal" className="mt-4 flex" />

                  <AttributionField control={control} errors={errors} />
                </section>
              </HiddenScrollbar>
            </TabsContent>

            <TabsContent
              value="analysis"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <HiddenScrollbar className="h-full px-6">
                <section className="grid gap-6 pb-5 pt-4">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Readability</h4>
                      <div className="flex items-center justify-center">
                        <Gauge
                          value={textMetrics.readabilityScore}
                          label="Score"
                          size={200}
                          animate={true}
                        />
                      </div>
                      {textMetrics.wordCount > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium">Feedback</h5>
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
                      <h4 className="text-sm font-medium">Text Statistics</h4>
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
                        <div className="col-span-2 space-y-1">
                          <p className="text-muted-foreground">
                            Avg. words per sentence
                          </p>
                          <p className="font-medium">
                            {textMetrics.avgWordsPerSentence}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        {textMetrics.wordCount === 0
                          ? "Getting Started"
                          : "Suggestions"}
                      </h4>
                      <div className="text-muted-foreground space-y-2 text-sm">
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

        <SidebarFooter className="bg-transparent shrink-0 px-6 py-6">
          {activeTab === "metadata" &&
            (mode === "create" ? (
              <AsyncButton
                type="button"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                className="w-full"
              >
                Save
              </AsyncButton>
            ) : (
              <AsyncButton
                type="button"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                className="w-full"
              >
                Update
              </AsyncButton>
            ))}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
