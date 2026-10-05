const MARKERS = /\[(?:BEGIN|END)_UNTRUSTED\]/g;

/**
 * Wraps customer-written text (post titles, workspace names) so the model
 * treats it as data, not instructions; the system prompt tells it to. The
 * markers are stripped from the text first so it can't close the block itself.
 */
export function untrusted(value: string): string;
export function untrusted(value: string | null | undefined): string | null;
export function untrusted(value: string | null | undefined) {
  if (value == null || value === "") {
    return value ?? null;
  }
  return `[BEGIN_UNTRUSTED]${value.replace(MARKERS, "")}[END_UNTRUSTED]`;
}
