"use client";

import { Separator } from "@marble/ui/components/separator";
import { Gauge } from "../../ui/gauge";
import { HiddenScrollbar } from "../hidden-scrollbar";

interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
  readabilityLevel: {
    level: string;
    description: string;
  };
  suggestions: string[];
}

interface AnalysisTabProps {
  textMetrics: TextMetrics;
}

export function AnalysisTab({ textMetrics }: AnalysisTabProps) {
  return (
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
                <p className="font-medium">{textMetrics.sentenceCount}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-muted-foreground">Avg. words per sentence</p>
                <p className="font-medium">{textMetrics.avgWordsPerSentence}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {textMetrics.wordCount === 0 ? "Getting Started" : "Suggestions"}
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
  );
}
