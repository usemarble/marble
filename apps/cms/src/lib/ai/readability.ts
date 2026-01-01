import { aiReadabilityResponseSchema } from "@/lib/validations/editor";

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  wordsPerSentence: number;
  readabilityScore: number;
  readingTime: number;
}

export async function fetchAiReadabilityRaw(params: {
  content: string;
  metrics: ReadabilityMetrics;
  postId?: string;
  bypassCache?: boolean;
}): Promise<string> {
  const { content, metrics, postId, bypassCache } = params;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (bypassCache) {
    headers["x-bypass-cache"] = "true";
  }
  const response = await fetch("/api/ai/suggestions", {
    method: "POST",
    headers,
    body: JSON.stringify({ content, metrics, postId }),
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
  postId?: string;
  bypassCache?: boolean;
}): Promise<string[]> {
  const text = await fetchAiReadabilityRaw({
    content: params.content,
    metrics: params.metrics,
    postId: params.postId,
    bypassCache: params.bypassCache,
  });
  return parseStringArrayFromText(text);
}

export async function fetchAiReadabilitySuggestionsObject(params: {
  content: string;
  metrics: ReadabilityMetrics;
  postId?: string;
  bypassCache?: boolean;
}): Promise<{
  suggestions: { text: string; explanation?: string; textReference?: string }[];
}> {
  const text = await fetchAiReadabilityRaw({
    content: params.content,
    metrics: params.metrics,
    postId: params.postId,
    bypassCache: params.bypassCache,
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
