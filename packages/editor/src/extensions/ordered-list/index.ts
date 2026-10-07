import { OrderedList as BaseOrderedList } from "@tiptap/extension-list";

const tokenizer = BaseOrderedList.config.markdownTokenizer;

/**
 * Ordered list with a fix for Tiptap's Markdown tokenizer.
 *
 * The tokenizer dedents the lines under `1. ` one column short (it leaves the
 * `.` out of the marker width), so a code block nested in a numbered step
 * gets an extra leading space on every line. Each item's block content goes
 * through `blockTokens` with its first line trimmed, so taking one space off
 * every other line lines the content back up. Drop this once Tiptap fixes
 * `collectOrderedListItems`: the markdown-input tests fail when it does.
 */
export const OrderedList = BaseOrderedList.extend({
  markdownTokenizer: tokenizer && {
    ...tokenizer,
    tokenize: (src, tokens, lexer) =>
      tokenizer.tokenize(src, tokens, {
        ...lexer,
        blockTokens: (block) => lexer.blockTokens(block.replace(/\n /g, "\n")),
      }),
  },
});
