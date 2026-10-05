import type { JSONContent } from "@tiptap/core";
import { DOMParser } from "linkedom";
import { htmlToTiptap } from "./html";
import { markdownToHtml } from "./markdown";

export type PostContentFormat = "html" | "markdown";

export interface NormalizedPostContent {
  /**
   * Sanitizer-ready HTML derived from the input. Callers should still sanitize
   * this value before storage because parser conversion is not an HTML policy.
   */
  html: string;
  /**
   * Tiptap JSON generated from the same source content.
   */
  contentJson: JSONContent;
  /**
   * Best-effort format classification used to choose the conversion path.
   */
  detectedFormat: PostContentFormat;
}

const markdownPatterns = [
  /^#{1,6}\s+.+/m,
  /\*\*[^*]+\*\*/m,
  /__[^_]+__/m,
  /\*[^*\n]+\*/m,
  /_[^_\n]+_/m,
  /\[[^\]]+\]\([^)]+\)/m,
  /^\s*[-*+]\s+\S+/m,
  /^\s*\d+\.\s+\S+/m,
  /```[\s\S]*?```/m,
  /`[^`\n]+`/m,
  /^\s*>\s+\S+/m,
  /!\[[^\]]*]\([^)]+\)/m,
  /^\s*[-*_]{3,}\s*$/m,
  /^\|.+\|$/m,
];

/**
 * Classifies post content as HTML or Markdown for defensive conversion.
 *
 * Only top-level text can signal Markdown. Markdown-looking strings in HTML
 * attributes, paragraphs, and code blocks are literal content; Markdown can
 * still contain raw HTML blocks alongside Markdown text.
 */
export function detectPostContentFormat(content: string): PostContentFormat {
  const trimmed = content.trim();

  if (!trimmed) {
    return "html";
  }

  const document = new DOMParser().parseFromString(
    `<html><body>${trimmed}</body></html>`,
    "text/html"
  );
  const body = document.body as unknown as {
    childNodes: ArrayLike<{ nodeType: number; textContent: string | null }>;
  };
  const topLevelText = Array.from(body.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? "")
    .join("\n");

  return markdownPatterns.some((pattern) => pattern.test(topLevelText))
    ? "markdown"
    : "html";
}

/**
 * Converts post content into Marble's storage pair: HTML plus Tiptap JSON.
 *
 * The JSON is derived from the generated/supplied HTML so raw editor HTML
 * embedded inside Markdown, such as figures and embeds, follows the same custom
 * node parsing path as normal HTML writes.
 */
export async function normalizePostContent(
  content: string
): Promise<NormalizedPostContent> {
  const detectedFormat = detectPostContentFormat(content);
  const html =
    detectedFormat === "markdown" ? await markdownToHtml(content) : content;

  return {
    html,
    contentJson: htmlToTiptap(html),
    detectedFormat,
  };
}
