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
import { useMemo, useState } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormWatch,
  useController,
} from "react-hook-form";
import striptags from "striptags";
import wordCount from "word-count";
import { useDebounce } from "@/hooks/use-debounce";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import {
  calculateReadabilityScore,
  generateSuggestions,
  getReadabilityLevel,
} from "@/utils/readability";
import { Gauge } from "../ui/gauge";
import { ButtonLoader } from "../ui/loader";
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
  const hasErrors = Object.keys(errors).length > 0;
  const { tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState("metadata");

  const {
    field: { value: contentValue },
  } = useController({
    name: "content",
    control,
  });

  // const wordCount = editorIntsance.editor?.storage.

  const debouncedContent = useDebounce(contentValue || "", 500);

  const textMetrics = useMemo(() => {
    const inputHtml = debouncedContent || "";
    const inputText = striptags(inputHtml);

    const wordCountResult = wordCount(inputText);

    const sentenceRegex = /[.!?]+/g;

    const sentences = inputText
      .split(sentenceRegex)
      .filter((sentence) => sentence.trim().length > 0);
    const sentenceCount = sentences.length;

    const avgWordsPerSentence =
      sentenceCount > 0 ? Math.round(wordCountResult / sentenceCount) : 0;
    const readabilityScore = calculateReadabilityScore(inputHtml);
    const readabilityLevel = getReadabilityLevel(readabilityScore);

    const metrics = {
      wordCount: wordCountResult,
      sentenceCount,
      avgWordsPerSentence,
      readabilityScore,
    };

    const suggestions = generateSuggestions(metrics);

    return {
      ...metrics,
      readabilityLevel,
      suggestions,
    };
  }, [debouncedContent]);

  const triggerSubmit = () => {
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
          "m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-sidebar/70",
          open ? "" : "mr-0"
        )}
        side="right"
        {...props}
      >
        <SidebarHeader className="sticky top-0 z-10 flex-shrink-0 bg-transparent px-6 py-4">
          <Tabs
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="flex justify-start gap-2" variant="underline">
              <TabsTrigger
                className="px-2"
                value="metadata"
                variant="underline"
              >
                Metadata
              </TabsTrigger>
              <TabsTrigger
                className="px-2"
                value="analysis"
                variant="underline"
              >
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

        <SidebarFooter className="flex-shrink-0 bg-transparent px-6 py-6">
          {activeTab === "metadata" &&
            (mode === "create" ? (
              <Button
                className="w-full"
                disabled={isSubmitting || !hasUnsavedChanges}
                onClick={triggerSubmit}
                type="button"
              >
                {isSubmitting ? (
                  <ButtonLoader className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={isSubmitting || !hasUnsavedChanges}
                onClick={triggerSubmit}
                type="button"
              >
                {isSubmitting ? (
                  <ButtonLoader className="size-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            ))}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
