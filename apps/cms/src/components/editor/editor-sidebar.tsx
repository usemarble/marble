"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@marble/ui/components/sidebar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import { SpinnerIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { EditorInstance } from "novel";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchAiReadabilitySuggestionsObject } from "@/lib/ai/readability";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import { useWorkspace } from "@/providers/workspace";
import {
  calculateReadabilityScore,
  generateSuggestions as generateLocalSuggestions,
} from "@/utils/readability";
import { MetadataFooter } from "./footer/metadata-footer";
import { MetadataTab } from "./tabs/metadata-tab";

const AnalysisTab = lazy(() =>
  import("./tabs/analysis-tab").then((m) => ({ default: m.AnalysisTab }))
);

const tabs = {
  metadata: "Metadata",
  analysis: "Analysis",
};

const TabLoadingSpinner = () => (
  <div className="flex h-full items-center justify-center px-6">
    <SpinnerIcon className="size-5 animate-spin" />
  </div>
);

type EditorSidebarProps = React.ComponentProps<typeof Sidebar> & {
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
};

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
  const { tags, authors: initialAuthors } = watch();
  const { activeWorkspace } = useWorkspace();

  const [editorText, setEditorText] = useState("");
  const [editorHTML, setEditorHTML] = useState("");

  useEffect(() => {
    if (!editor) {
      return;
    }
    setEditorText(editor.getText());
    setEditorHTML(editor.getHTML());
    const handler = () => {
      const nextText = editor.getText();
      const nextHTML = editor.getHTML();
      setEditorText((prev) => (prev === nextText ? prev : nextText));
      setEditorHTML((prev) => (prev === nextHTML ? prev : nextHTML));
    };
    editor.on("update", handler);
    editor.on("create", handler);
    return () => {
      editor.off("update", handler);
      editor.off("create", handler);
    };
  }, [editor]);

  const aiEnabled = Boolean(activeWorkspace?.ai?.enabled);
  const debouncedText = useDebounce(editorText, aiEnabled ? 1500 : 500);

  const metrics = useMemo(() => {
    const text = debouncedText;
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        wordsPerSentence: 0,
        readabilityScore: 0,
        readingTime: 0,
      };
    }
    const words = text
      .trim()
      .split(/\s+/u)
      .filter((w) => w.length > 0);
    const wordCount = editor?.storage?.characterCount?.words
      ? editor.storage.characterCount.words()
      : words.length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    const wordsPerSentence =
      sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

    const readabilityScore = editor ? calculateReadabilityScore(editor) : 0;
    const readingTime = wordCount / 238;
    return {
      wordCount,
      sentenceCount,
      wordsPerSentence,
      readabilityScore,
      readingTime,
    };
  }, [editor, debouncedText]);

  const [hasFetchedAiOnce, setHasFetchedAiOnce] = useState(false);

  const localSuggestions = useMemo(
    () =>
      generateLocalSuggestions({
        wordCount: metrics.wordCount,
        sentenceCount: metrics.sentenceCount,
        wordsPerSentence: metrics.wordsPerSentence,
        readabilityScore: metrics.readabilityScore,
      }),
    [
      metrics.wordCount,
      metrics.sentenceCount,
      metrics.wordsPerSentence,
      metrics.readabilityScore,
    ]
  );

  // biome-ignore lint/style/noNonNullAssertion: <>
  const workspaceId = activeWorkspace!.id;

  const {
    data: aiData,
    isFetching: aiLoading,
    refetch: refetchAi,
  } = useQuery({
    // Use a stable key so content changes don't auto-trigger refetches
    queryKey: QUERY_KEYS.AI_READABILITY_SUGGESTIONS(
      workspaceId,
      "current-document"
    ),
    // Disabled by default; we'll manually refetch on initial open and button click
    enabled: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    queryFn: async () =>
      fetchAiReadabilitySuggestionsObject({
        content: editorHTML,
        metrics: {
          wordCount: metrics.wordCount,
          sentenceCount: metrics.sentenceCount,
          wordsPerSentence: metrics.wordsPerSentence,
          readabilityScore: metrics.readabilityScore,
          readingTime: metrics.readingTime,
        },
      }),
  });

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(Object.keys(tabs)).withDefault("metadata")
  );

  useEffect(() => {
    if (
      aiEnabled &&
      activeTab === "analysis" &&
      !!workspaceId &&
      !hasFetchedAiOnce &&
      editorHTML.trim().length > 0
    ) {
      refetchAi();
      setHasFetchedAiOnce(true);
    }
  }, [
    aiEnabled,
    activeTab,
    workspaceId,
    hasFetchedAiOnce,
    editorHTML,
    refetchAi,
  ]);

  const handleRefreshAi = () => {
    refetchAi();
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
            <TabsList
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${Object.keys(tabs).length}, 1fr)`,
              }}
              variant="line"
            >
              {Object.entries(tabs).map(([value, label]) => (
                <TabsTrigger className="px-2" key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
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
              <Suspense fallback={<TabLoadingSpinner />}>
                <MetadataTab
                  control={control}
                  errors={errors}
                  initialAuthors={initialAuthors}
                  tags={tags}
                />
              </Suspense>
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
              value="analysis"
            >
              <Suspense fallback={<TabLoadingSpinner />}>
                <AnalysisTab
                  aiEnabled={aiEnabled}
                  aiLoading={aiLoading}
                  aiSuggestions={aiData?.suggestions ?? []}
                  editor={editor}
                  localSuggestions={localSuggestions}
                  onRefreshAi={handleRefreshAi}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="shrink-0 bg-transparent px-6 py-6">
          {activeTab === "metadata" && (
            <MetadataFooter
              errors={errors}
              formRef={formRef}
              isSubmitting={isSubmitting}
              mode={mode}
            />
          )}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
