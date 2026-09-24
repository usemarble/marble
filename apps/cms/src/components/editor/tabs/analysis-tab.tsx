"use client";

import { useCurrentEditor } from "@marble/editor";
import { Button } from "@marble/ui/components/button";
import { Card, CardContent } from "@marble/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { ArrowClockwiseIcon, InfoIcon } from "@phosphor-icons/react";
import { useCallback, useState, useSyncExternalStore } from "react";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { useReadability } from "@/hooks/use-readability";
import {
  getAiSuggestionsErrorMessage,
  isAiEntitlementError,
} from "@/lib/ai/readability";
import { getReadabilityFeedback } from "@/utils/readability";
import { Gauge, getGaugeZoneClass } from "../../ui/gauge";
import { HiddenScrollbar } from "../../ui/hidden-scrollbar";
import type { ReadabilitySuggestion } from "../ai/readability-suggestions";
import { ReadabilitySuggestions } from "../ai/readability-suggestions";

function formatReadingTime(minutes: number) {
  if (minutes === 0) {
    return "0 min";
  }
  if (minutes < 1) {
    return "<1 min";
  }
  return `${Math.round(minutes)} min`;
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[12px] bg-background px-3 py-2.5 shadow-xs">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

interface AnalysisTabProps {
  aiSuggestions?: ReadabilitySuggestion[];
  aiLoading?: boolean;
  onRefreshAi?: () => void;
  /** Whether the workspace plan includes AI suggestions. */
  canUseAi?: boolean;
  /** Request failed outright (rate limited, network, bad response). */
  aiError?: unknown;
  /** Request succeeded but the model could not produce suggestions. */
  aiUnavailable?: boolean;
}

export function AnalysisTab({
  aiSuggestions,
  aiLoading,
  onRefreshAi,
  canUseAi = true,
  aiError,
  aiUnavailable = false,
}: AnalysisTabProps) {
  const { editor } = useCurrentEditor();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!editor) {
        return () => {
          return;
        };
      }
      editor.on("update", callback);
      editor.on("create", callback);
      return () => {
        editor.off("update", callback);
        editor.off("create", callback);
      };
    },
    [editor]
  );

  const editorText = useSyncExternalStore(
    subscribe,
    () => editor?.getText() ?? "",
    () => ""
  );

  const textMetrics = useReadability({ editor, text: editorText });
  const hasContent = textMetrics.wordCount > 0;

  // The server is the authority on entitlement: a 403 here means the cached
  // plan is stale, so offer the upgrade rather than a retry that cannot work.
  const showUpgrade = !canUseAi || isAiEntitlementError(aiError);

  // A failure must explain itself: otherwise an outage or a rate limit is
  // indistinguishable from "nothing to suggest".
  let aiFailureMessage: string | null = null;
  if (!(showUpgrade || aiLoading)) {
    if (aiError) {
      aiFailureMessage = getAiSuggestionsErrorMessage(aiError);
    } else if (aiUnavailable && (aiSuggestions?.length ?? 0) === 0) {
      aiFailureMessage = "We couldn't generate suggestions just now.";
    }
  }

  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="grid gap-6 pt-4 pb-5">
        <div className="flex flex-col gap-4">
          <Card className="gap-0 rounded-[20px] border-none bg-surface p-2 pt-0 shadow-none">
            <div className="flex h-10 select-none items-center gap-1.5 px-1.5">
              <span className="text-muted-foreground text-xs">Readability</span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InfoIcon
                      aria-label="How readability is scored"
                      className="h-3.5 w-3.5 cursor-help text-muted-foreground"
                    />
                  }
                />
                <TooltipContent className="max-w-64">
                  <p className="text-xs">
                    Flesch reading ease, scored 0 to 100 from your average
                    sentence length and syllables per word. Higher is easier to
                    read. Aim for 60 or above for most web writing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardContent className="flex flex-col items-center gap-3 rounded-[12px] bg-background p-4 shadow-xs">
              <Gauge
                label="Readability score"
                size={200}
                value={textMetrics.readabilityScore}
              />
              {hasContent ? (
                <div className="space-y-1 text-center">
                  <p className="flex items-center justify-center gap-1.5 font-medium text-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        getGaugeZoneClass(textMetrics.readabilityScore)
                      )}
                    />
                    {textMetrics.readabilityLevel.level}
                  </p>
                  <p className="text-balance text-muted-foreground text-xs">
                    {getReadabilityFeedback(textMetrics)}
                  </p>
                </div>
              ) : (
                <p className="text-balance text-center text-muted-foreground text-xs">
                  Start writing to see how readable your post is.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-[20px] border-none bg-surface p-2 pt-0 shadow-none">
            <div className="flex h-10 select-none items-center px-1.5">
              <span className="text-muted-foreground text-xs">
                Text Statistics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Words" value={textMetrics.wordCount} />
              <StatTile
                label="Reading Time"
                value={formatReadingTime(textMetrics.readingTime)}
              />
              <StatTile label="Sentences" value={textMetrics.sentenceCount} />
              <StatTile
                label="Avg. Words / Sentence"
                value={textMetrics.wordsPerSentence}
              />
            </div>
          </Card>

          <Card className="group gap-0 rounded-[20px] border-none bg-surface p-2 pt-0 shadow-none">
            <div className="flex h-10 select-none items-center justify-between gap-2 px-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">
                  {hasContent ? "Suggestions" : "Getting Started"}
                </span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <InfoIcon
                        aria-label="About suggestions"
                        className="h-3.5 w-3.5 cursor-help text-muted-foreground"
                      />
                    }
                  />
                  <TooltipContent className="max-w-64">
                    <p className="text-xs">
                      AI-generated ideas for making this post easier to read,
                      based on its content. Click a suggestion marked with a
                      pointer to highlight the text it refers to.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {showUpgrade ? null : (
                <Button
                  aria-label="Refresh suggestions"
                  className="h-7 w-7 cursor-pointer"
                  disabled={Boolean(aiLoading)}
                  onClick={onRefreshAi}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowClockwiseIcon
                    className={aiLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                  />
                </Button>
              )}
            </div>
            <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
              {aiFailureMessage ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <p className="text-balance text-muted-foreground text-sm">
                    {aiFailureMessage}
                  </p>
                  <Button
                    disabled={Boolean(aiLoading)}
                    onClick={onRefreshAi}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Try again
                  </Button>
                </div>
              ) : null}
              {showUpgrade || aiFailureMessage ? null : (
                <ReadabilitySuggestions
                  editor={editor ?? null}
                  isLoading={aiLoading}
                  suggestions={aiSuggestions ?? []}
                />
              )}
              {showUpgrade ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <p className="text-balance text-muted-foreground text-sm">
                    Upgrade your plan for AI suggestions.
                  </p>
                  <Button
                    onClick={() => setIsUpgradeOpen(true)}
                    size="sm"
                    type="button"
                  >
                    Upgrade
                  </Button>
                  <UpgradeModal
                    feature="ai-readability"
                    isOpen={isUpgradeOpen}
                    onClose={() => setIsUpgradeOpen(false)}
                    openPricingInNewTab
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </HiddenScrollbar>
  );
}
