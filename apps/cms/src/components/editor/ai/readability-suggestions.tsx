"use client";

import type { Editor } from "@marble/editor";
import { cn } from "@marble/ui/lib/utils";
import { CursorClickIcon } from "@phosphor-icons/react";
import React from "react";

export type ReadabilitySuggestion = {
  text: string;
  explanation?: string;
  textReference?: string;
};

type ReadabilitySuggestionsProps = {
  editor?: Editor | null;
  suggestions: ReadabilitySuggestion[];
  isLoading?: boolean;
  onRefresh?: () => void;
};

function highlightTextInEditor(editor: Editor, textReference: string) {
  const trimmed = textReference.trim();
  if (!trimmed) {
    return;
  }

  let foundFrom: number | null = null;
  let foundTo: number | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (foundFrom !== null) {
      return false;
    }
    if (node.isText && typeof node.text === "string") {
      const index = node.text.indexOf(trimmed);
      if (index >= 0) {
        foundFrom = pos + index;
        foundTo = foundFrom + trimmed.length;
        return false;
      }
    }
    return true;
  });

  if (foundFrom !== null && foundTo !== null) {
    editor
      .chain()
      .focus()
      .setTextSelection({ from: foundFrom, to: foundTo })
      .run();
  } else {
    editor.chain().focus().run();
  }
}

function ReadabilitySuggestionsBase({
  editor,
  suggestions,
  isLoading,
}: ReadabilitySuggestionsProps) {
  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Generating suggestions…</p>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <button
              className={cn(
                "text-left text-muted-foreground text-sm leading-relaxed transition-colors",
                suggestion.textReference
                  ? "cursor-pointer hover:text-foreground"
                  : ""
              )}
              key={`${suggestion.text}-${index}`}
              onClick={() => {
                if (suggestion.textReference && editor) {
                  highlightTextInEditor(editor, suggestion.textReference);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (suggestion.textReference && editor) {
                    highlightTextInEditor(editor, suggestion.textReference);
                  }
                }
              }}
              type="button"
            >
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div className="flex-1">
                  <span>{suggestion.text}</span>
                  {suggestion.textReference && (
                    <CursorClickIcon className="ml-1 inline h-3 w-3" />
                  )}
                  {suggestion.explanation && (
                    <div className="mt-1 text-muted-foreground/80 text-xs italic">
                      {suggestion.explanation}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No suggestions yet.</p>
      )}
    </div>
  );
}

export const ReadabilitySuggestions = React.memo(
  ReadabilitySuggestionsBase,
  (prev, next) => {
    if (prev.isLoading !== next.isLoading) {
      return false;
    }
    if (prev.editor !== next.editor) {
      return false;
    }
    if (prev.suggestions.length !== next.suggestions.length) {
      return false;
    }
    for (let i = 0; i < prev.suggestions.length; i += 1) {
      const a = prev.suggestions[i];
      const b = next.suggestions[i];
      if (!a || !b) {
        return false;
      }
      if (
        a.text !== b.text ||
        a.explanation !== b.explanation ||
        a.textReference !== b.textReference
      ) {
        return false;
      }
    }
    return true;
  }
);
