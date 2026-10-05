import type { JSONContent } from "@tiptap/core";

/**
 * Canonical empty Tiptap document used when source content is blank or cannot
 * be converted safely.
 */
export const EMPTY_TIPTAP_DOC: JSONContent = { type: "doc", content: [] };

/**
 * Minimal DOM element shape used by linkedom and ProseMirror parsing on the
 * server. It keeps custom parser helpers independent from browser-only DOM
 * types while preserving enough API surface for extension `parseHTML` hooks.
 */
export interface ParseableElement {
  getAttribute: (name: string) => string | null;
  parentElement: ParseableElement | null;
  querySelector: (selector: string) => ParseableElement | null;
  tagName: string;
  textContent: string | null;
}
