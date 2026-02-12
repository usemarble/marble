import { textblockTypeInputRule } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { lowlight } from "../../lib/lowlight";
import { CodeBlockView } from "./code-block-view";

/**
 * Code Block extension with syntax highlighting and custom UI.
 *
 * Extends CodeBlockLowlight with a React NodeView that renders a card-style
 * wrapper with a searchable language selector and copy button.
 * Lowlight decorations (syntax highlighting) still apply through ProseMirror.
 *
 * Input rules are overridden so that triple backticks (or tildes) followed by
 * space/enter immediately insert a code block with language "text", without
 * allowing a language string after the backticks (Notion-style behaviour).
 * Language selection happens exclusively via the dropdown in the UI.
 */
export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^```[\s\n]$/,
        type: this.type,
        getAttributes: () => ({ language: "text" }),
      }),
      textblockTypeInputRule({
        find: /^~~~[\s\n]$/,
        type: this.type,
        getAttributes: () => ({ language: "text" }),
      }),
    ];
  },
}).configure({
  lowlight,
  defaultLanguage: "text",
});
