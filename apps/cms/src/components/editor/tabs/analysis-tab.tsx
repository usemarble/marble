"use client";

import { useCurrentEditor } from "@marble/editor";
import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { ArrowClockwiseIcon, InfoIcon } from "@phosphor-icons/react";
import { useCallback, useState, useSyncExternalStore } from "react";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { useReadability } from "@/hooks/use-readability";
import {
  getAiSuggestionsErrorMessage,
  isAiEntitlementError,
} from "@/lib/ai/readability";
import { Gauge } from "../../ui/gauge";
import { HiddenScrollbar } from "../../ui/hidden-scrollbar";
import type { ReadabilitySuggestion } from "../ai/readability-suggestions";
import { ReadabilitySuggestions } from "../ai/readability-suggestions";

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
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-sm">
                  {textMetrics.wordCount === 0
                    ? "Getting Started"
                    : "Suggestions"}
                </h4>
                {!showUpgrade && textMetrics.wordCount > 0 ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <InfoIcon
                          aria-label="AI generated"
                          className="h-3.5 w-3.5 cursor-help text-muted-foreground"
                        />
                      }
                    />
                    <TooltipContent>
                      <p className="text-xs">
                        These suggestions are AI-generated
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
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
            {aiFailureMessage ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
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
              <div className="flex flex-col items-center gap-3 py-6 text-center">
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
          </div>
        </div>
      </section>
    </HiddenScrollbar>
  );
}
