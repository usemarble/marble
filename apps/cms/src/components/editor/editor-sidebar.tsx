"use client";

import { Button } from "@marble/ui/components/button";
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

import { ButtonLoader } from "../ui/loader";
import { AnalysisTab, MetadataTab, ChatTab } from "./tabs";

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
          "bg-sidebar/70 m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border",
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
            <TabsList variant="underline" className="grid grid-cols-3">
              <TabsTrigger
                variant="underline"
                value="metadata"
                className="px-2"
              >
                Metadata
              </TabsTrigger>
              <TabsTrigger
                variant="underline"
                value="analysis"
                className="px-2"
              >
                Analysis
              </TabsTrigger>
              <TabsTrigger variant="underline" value="chat" className="px-2">
                Chat
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
              <MetadataTab
                control={control}
                errors={errors}
                initialAuthors={initialAuthors}
                tags={tags}
              />
            </TabsContent>

            <TabsContent
              value="analysis"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <AnalysisTab textMetrics={textMetrics} />
            </TabsContent>

            <TabsContent
              value="chat"
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ChatTab />
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="bg-transparent shrink-0 px-6 py-6">
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
