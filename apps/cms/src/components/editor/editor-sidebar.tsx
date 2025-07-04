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
import { useState, useEffect, useMemo } from "react";
import {
  useController,
  type Control,
  type FieldErrors,
  type UseFormClearErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormTrigger,
  type UseFormWatch,
} from "react-hook-form";
import wordCount from "word-count";
import striptags from "striptags";
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
import { Gauge } from "../ui/gauge";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function calculateReadabilityScore(html: string): number {
  const text = striptags(html);
  if (!text || text.trim().length === 0) return 0;

  const wordCountResult = wordCount(text);
  const sentences = text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);

  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  if (sentences.length === 0 || wordCountResult === 0) return 0;

  const avgSentenceLength = wordCountResult / sentences.length;
  const avgSyllablesPerWord = syllables / wordCountResult;

  const score =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");

  const syllableMatches = word.match(/[aeiouy]{1,2}/g);
  return syllableMatches ? syllableMatches.length : 1;
}

function getReadabilityLevel(score: number): {
  level: string;
  description: string;
} {
  if (score >= 90)
    return {
      level: "Very Easy",
      description: "Easily understood by an average 11-year-old student",
    };
  if (score >= 80)
    return {
      level: "Easy",
      description: "Conversational English for consumers",
    };
  if (score >= 70)
    return {
      level: "Fairly Easy",
      description: "Easily understood by 13- to 15-year-old students",
    };
  if (score >= 60)
    return {
      level: "Standard",
      description: "Easily understood by 15- to 17-year-old students",
    };
  if (score >= 50)
    return {
      level: "Fairly Difficult",
      description: "Understood by 13- to 15-year-old students",
    };
  if (score >= 30)
    return {
      level: "Difficult",
      description: "Best understood by university graduates",
    };
  return {
    level: "Very Difficult",
    description: "Best understood by university graduates",
  };
}

function generateSuggestions(metrics: {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
}): string[] {
  const { wordCount, sentenceCount, avgWordsPerSentence, readabilityScore } =
    metrics;
  const suggestions: string[] = [];

  if (wordCount === 0) {
    suggestions.push(
      "Start writing your content to get SEO insights and readability analysis",
    );
    suggestions.push("Aim for at least 300 words for good SEO performance");
    return suggestions;
  }

  if (wordCount <= 50) {
    suggestions.push(
      "Add more content - articles with 300+ words tend to perform better in search results",
    );
    suggestions.push(
      "Consider expanding your ideas with examples, details, or explanations",
    );
    return suggestions;
  }

  if (wordCount <= 150) {
    suggestions.push(
      "Your content is quite short. Consider adding more details for better SEO",
    );
    suggestions.push(
      "Aim for 300-600 words for optimal search engine visibility",
    );
    if (sentenceCount < 3) {
      suggestions.push(
        "Break your content into more sentences for better readability",
      );
    }
    return suggestions;
  }

  if (wordCount <= 300) {
    suggestions.push(
      "Good start! Consider expanding to 300-600 words for better SEO performance",
    );
    if (avgWordsPerSentence > 25) {
      suggestions.push(
        `Your sentences are quite long (avg: ${avgWordsPerSentence} words). Try shorter sentences for better readability`,
      );
    }
    if (readabilityScore < 50) {
      suggestions.push("Consider using simpler words to improve readability");
    }
    return suggestions;
  }
  if (avgWordsPerSentence > 25) {
    suggestions.push(
      `Consider shorter sentences (avg: ${avgWordsPerSentence} words) to improve readability`,
    );
  }

  if (readabilityScore < 30) {
    suggestions.push(
      "Your content is quite complex. Consider using simpler vocabulary for broader accessibility",
    );
  } else if (readabilityScore < 50) {
    suggestions.push(
      "Consider simplifying some sentences to improve readability",
    );
  }

  if (sentenceCount < wordCount / 20) {
    suggestions.push(
      "Consider breaking up some longer sentences into shorter ones",
    );
  }

  if (wordCount > 1000 && avgWordsPerSentence < 15) {
    suggestions.push(
      "Your content is comprehensive! Consider varying sentence length for better flow",
    );
  }

  if (suggestions.length === 0) {
    if (readabilityScore >= 60) {
      suggestions.push(
        "Great! Your content has good readability and length for SEO",
      );
    } else {
      suggestions.push(
        "Your content length is good. Focus on improving readability for better engagement",
      );
    }
  }

  return suggestions;
}

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

  const {
    field: { value: contentValue },
  } = useController({
    name: "content",
    control,
  });

  const debouncedContent = useDebounce(contentValue || "", 500);

  const textMetrics = useMemo(() => {
    const inputHtml = debouncedContent || "";
    const inputText = striptags(inputHtml);

    const wordCountResult = wordCount(inputText);

    const sentences = inputText
      .split(/[.!?]+/)
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
        side="right"
        className={cn(
          "bg-sidebar m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border shadow-sm",
          !open ? "mr-0" : "",
        )}
        {...props}
      >
        <SidebarHeader className="bg-sidebar sticky top-0 z-10 flex-shrink-0 px-6 py-2">
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

        <SidebarContent className="bg-sidebar min-h-0 flex-1 overflow-hidden">
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

                  <Separator orientation="horizontal" className="mt-4 flex" />

                  <AttributionField
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                  />
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
                        {textMetrics.suggestions.map((suggestion, index) => (
                          <p key={index}>• {suggestion}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </HiddenScrollbar>
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="bg-sidebar flex-shrink-0 px-6 py-6">
          {activeTab === "metadata" &&
            (mode === "create" ? (
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
            ))}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
