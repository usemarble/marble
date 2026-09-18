import {
  aiReadabilityResponseSchema,
  MAX_AI_READABILITY_CONTENT_LENGTH,
} from "@/lib/validations/editor";

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  wordsPerSentence: number;
  readabilityScore: number;
  readingTime: number;
}

/** A non-2xx answer from the suggestions route, carrying its status. */
export class AiSuggestionsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiSuggestionsError";
    this.status = status;
  }
}

export interface AiReadabilityResult {
  suggestions: { text: string; explanation?: string; textReference?: string }[];
  /**
   * The route answered 200 but the model call failed, so there are no
   * suggestions this time. Distinct from a genuinely empty result.
   */
  unavailable: boolean;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Body was not JSON - fall back to the status text.
  }
  return response.statusText || "Request failed";
}

/** Reader-facing explanation for a failed suggestions request. */
export function getAiSuggestionsErrorMessage(error: unknown): string {
  if (error instanceof AiSuggestionsError && error.status === 429) {
    return "You've hit the suggestion limit. Try again in a few minutes.";
  }
  return "We couldn't generate suggestions just now.";
}

function parseResponseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const chunk = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => line.startsWith("{") && line.endsWith("}"));
    if (!chunk) {
      return null;
    }
    try {
      return JSON.parse(chunk);
    } catch {
      return null;
    }
  }
}

export async function fetchAiReadabilitySuggestionsObject(params: {
  content: string;
  metrics: ReadabilityMetrics;
  postId?: string;
  bypassCache?: boolean;
}): Promise<AiReadabilityResult> {
  const { content, metrics, postId, bypassCache } = params;
  const boundedContent = content.slice(0, MAX_AI_READABILITY_CONTENT_LENGTH);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (bypassCache) {
    headers["x-bypass-cache"] = "true";
  }

  const response = await fetch("/api/ai/suggestions", {
    method: "POST",
    headers,
    body: JSON.stringify({ content: boundedContent, metrics, postId }),
  });

  if (!response.ok) {
    throw new AiSuggestionsError(
      await readErrorMessage(response),
      response.status
    );
  }

  // The route answers 200 with an empty list when the model call fails, and
  // flags it with this header - without reading it a model outage is
  // indistinguishable from "nothing to suggest".
  const unavailable =
    response.headers.get("X-Marble-AI-Status") === "unavailable";

  const parsed = aiReadabilityResponseSchema.safeParse(
    parseResponseJson(await response.text())
  );

  if (!parsed.success) {
    return { suggestions: [], unavailable };
  }

  return { suggestions: parsed.data.suggestions, unavailable };
}
