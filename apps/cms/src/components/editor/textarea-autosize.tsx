"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";

import type { TextareaAutosizeProps } from "react-textarea-autosize";
import ReactTextareaAutosize from "react-textarea-autosize";

import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";

type ExtendedTextareaAutosizeProps = TextareaAutosizeProps & {
  onEnterPress?: () => void;
};

export function TextareaAutosize({
  onEnterPress,
  onKeyDown,
  ...props
}: ExtendedTextareaAutosizeProps) {
  const [isRerendered, setIsRerendered] = useState(false);

  useIsomorphicLayoutEffect(() => setIsRerendered(true), []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEnterPress?.();
    }
    onKeyDown?.(event);
  }

  return isRerendered ? (
    <ReactTextareaAutosize onKeyDown={handleKeyDown} {...props} />
  ) : null;
}

TextareaAutosize.displayName = "TextareaAutosize";
