import { aiReadabilityResponseSchema } from "@/lib/validations/editor";

export type ReadabilityMetrics = {
  wordCount: number;
  sentenceCount: number;
  wordsPerSentence: number;
  readabilityScore: number;
  readingTime: number;
};

export async function fetchAiReadabilityRaw(params: {
  content: string;
  metrics: ReadabilityMetrics;
}): Promise<string> {
  const { content, metrics } = params;
  const response = await fetch("/api/ai/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, metrics }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch AI suggestions");
  }

  return response.text();
}

export function parseStringArrayFromText(textBody: string): string[] {
  const tryParseArray = (s: string): string[] | null => {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  };

  const asWhole = tryParseArray(textBody);
  if (asWhole) {
    return asWhole;
  }

  const lines = textBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const arr = tryParseArray(line);
    if (arr) {
      return arr;
    }
  }
  return [];
}

export async function fetchAiReadabilitySuggestionsStrings(params: {
  content: string;
  metrics: ReadabilityMetrics;
}): Promise<string[]> {
  const text = await fetchAiReadabilityRaw({
    content: params.content,
    metrics: params.metrics,
  });
  return parseStringArrayFromText(text);
}

export async function fetchAiReadabilitySuggestionsObject(params: {
  content: string;
  metrics: ReadabilityMetrics;
}): Promise<{
  suggestions: { text: string; explanation?: string; textReference?: string }[];
}> {
  const text = await fetchAiReadabilityRaw({
    content: params.content,
    metrics: params.metrics,
  });

  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    const chunk = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .find((l) => l.startsWith("{") && l.endsWith("}"));
    if (chunk) {
      json = JSON.parse(chunk);
    }
  }

  const parsed = aiReadabilityResponseSchema.safeParse(json);
  if (!parsed.success) {
    return { suggestions: [] };
  }
  return parsed.data;
}
