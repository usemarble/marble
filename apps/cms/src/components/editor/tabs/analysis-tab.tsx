"use client";

import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import { ArrowClockwise } from "@phosphor-icons/react";
import type { EditorInstance } from "novel";
import { useEffect, useState } from "react";
import { useReadability } from "@/hooks/use-readability";
import { Gauge } from "../../ui/gauge";
import type { ReadabilitySuggestion } from "../ai/readability-suggestions";
import { ReadabilitySuggestions } from "../ai/readability-suggestions";
import { HiddenScrollbar } from "../hidden-scrollbar";

type AnalysisTabProps = {
  editor?: EditorInstance | null;
  aiSuggestions?: ReadabilitySuggestion[];
  aiLoading?: boolean;
  onRefreshAi?: () => void;
  aiEnabled?: boolean;
  localSuggestions?: string[];
};

export function AnalysisTab({
  editor,
  aiSuggestions,
  aiLoading,
  onRefreshAi,
  aiEnabled,
  localSuggestions,
}: AnalysisTabProps) {
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

  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="grid gap-6 pt-4 pb-5">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Readability</h4>
            <div className="flex items-center justify-center">
              <Gauge
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
                <p className="font-medium">{textMetrics.sentenceCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Words per Sentence</p>
                <p className="font-medium">{textMetrics.wordsPerSentence}</p>
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

          <div className="group space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {textMetrics.wordCount === 0
                  ? "Getting Started"
                  : "Suggestions"}
              </h4>
              {aiEnabled && (
                <Button
                  aria-label="Refresh suggestions"
                  className="h-7 w-7 cursor-pointer"
                  disabled={Boolean(aiLoading)}
                  onClick={onRefreshAi}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowClockwise
                    className={aiLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                  />
                </Button>
              )}
            </div>
            {aiEnabled ? (
              <ReadabilitySuggestions
                editor={editor ?? null}
                isLoading={aiLoading}
                suggestions={aiSuggestions ?? []}
              />
            ) : (
              <div className="space-y-2 text-muted-foreground text-sm">
                {(localSuggestions ?? textMetrics.suggestions).map(
                  (suggestion) => (
                    <p key={suggestion}>• {suggestion}</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </HiddenScrollbar>
  );
}
