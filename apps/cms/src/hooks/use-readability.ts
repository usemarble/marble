"use client";

import type { Editor } from "@marble/editor";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  calculateReadabilityScore,
  generateSuggestions as generateLocalSuggestions,
  getReadabilityLevel,
} from "@/utils/readability";

interface UseReadabilityParams {
  editor: Editor | null;
  text: string;
}

type ReadabilityLevel = ReturnType<typeof getReadabilityLevel>;

export interface ReadabilityResult {
  wordCount: number;
  sentenceCount: number;
  wordsPerSentence: number;
  readabilityScore: number;
  readabilityLevel: ReadabilityLevel;
  readingTime: number;
  suggestions: string[];
}

const READING_SPEED = 238;

function countSyllablesForWord(word: string): number {
  const lower = word.toLowerCase();
  if (lower.length <= 3) {
    return 1;
  }
  const withoutEs = lower.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, "");
  const withoutY = withoutEs.replace(/^y/u, "");
  const matches = withoutY.match(/[aeiouy]{1,2}/gu);
  return matches ? matches.length : 1;
}

function computeMetrics(text: string, editor?: Editor | null) {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      wordsPerSentence: 0,
      readabilityScore: 0,
      readabilityLevel: {
        level: "Unknown",
        description: "Unknown",
      } as ReadabilityLevel,
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
  const sentences = text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);
  const sentenceCount = sentences.length;
  const wordsPerSentence =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  let readabilityScore: number;
  if (editor) {
    readabilityScore = calculateReadabilityScore(editor);
  } else {
    const totalSyllables = words.reduce(
      (acc, w) => acc + countSyllablesForWord(w),
      0
    );
    if (sentenceCount === 0 || wordCount === 0) {
      readabilityScore = 0;
    } else {
      const avgSentenceLength = wordCount / sentenceCount;
      const avgSyllablesPerWord = totalSyllables / wordCount;
      const score =
        206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
      readabilityScore = Math.max(0, Math.min(100, Math.round(score)));
    }
  }

  const readabilityLevel = getReadabilityLevel(readabilityScore);
  const readingTime = wordCount / READING_SPEED;

  return {
    wordCount,
    sentenceCount,
    wordsPerSentence,
    readabilityScore,
    readabilityLevel,
    readingTime,
  };
}

export function useReadability({
  editor,
  text,
}: UseReadabilityParams): ReadabilityResult {
  const metrics = useMemo(() => computeMetrics(text, editor), [text, editor]);

  const { data: localSuggestions = [] } = useQuery<string[]>({
    queryKey: [
      "local-readability-suggestions",
      metrics.wordCount,
      metrics.sentenceCount,
      metrics.wordsPerSentence,
      metrics.readabilityScore,
    ],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    queryFn: async () =>
      generateLocalSuggestions({
        wordCount: metrics.wordCount,
        sentenceCount: metrics.sentenceCount,
        wordsPerSentence: metrics.wordsPerSentence,
        readabilityScore: metrics.readabilityScore,
      }),
  });

  return {
    ...metrics,
    suggestions: localSuggestions,
  };
}
