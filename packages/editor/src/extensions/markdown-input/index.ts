import { type Editor, Extension } from "@tiptap/core";
import {
  DOMSerializer,
  DOMParser as ProseMirrorDOMParser,
} from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { looksLikeMarkdown, parseMarkdown } from "./utils";

function isMarkdownFile(file: File) {
  return (
    file.name.endsWith(".md") ||
    file.name.endsWith(".markdown") ||
    file.type === "text/markdown"
  );
}

/**
 * Inserts Markdown at the selection. Returns false if it couldn't be
 * inserted, so a paste can fall back to the default plain-text paste.
 */
function insertMarkdown(editor: Editor, markdown: string): boolean {
  try {
    const content = parseMarkdown(editor, markdown);
    try {
      return editor.commands.insertContent(content);
    } catch {
      // The parsed document breaks a schema rule, e.g. an image mid-sentence
      // (figures are blocks) or at the start of a list item. Render it to DOM
      // and parse that back, which makes ProseMirror repair the structure.
      const { schema } = editor;
      const dom = DOMSerializer.fromSchema(schema).serializeFragment(
        schema.nodeFromJSON(content).content
      );
      const doc = ProseMirrorDOMParser.fromSchema(schema).parse(dom, {
        preserveWhitespace: "full",
      });
      return editor.commands.insertContent(doc.content);
    }
  } catch (error) {
    console.error("Failed to insert markdown:", error);
    return false;
  }
}

async function insertMarkdownFiles(editor: Editor, files: File[]) {
  for (const file of files) {
    insertMarkdown(editor, await file.text());
  }
}

/**
 * Whether the clipboard's HTML only wraps its plain text, in which case the
 * text should be read as Markdown rather than pasted as HTML:
 * - Chrome shows a plain-text page (a raw `.md` file) as one `<pre>` styled
 *   `word-wrap: break-word; white-space: pre-wrap`, and copies it that way.
 *   It would otherwise paste as a single code block. A code sample copied
 *   from a site has `<code>` or highlighting inside, its own id or classes,
 *   or at least not that styling, so it stays a code block.
 * - VS Code adds syntax-highlighted HTML, and says which language it was.
 */
function isWrappedPlainText(data: DataTransfer): boolean {
  const vscode = data.getData("vscode-editor-data");
  if (vscode) {
    try {
      return JSON.parse(vscode).mode === "markdown";
    } catch {
      return false;
    }
  }

  const html = data.getData("text/html");
  const { body } = new DOMParser().parseFromString(html, "text/html");
  const [pre, ...rest] = Array.from(body.children);
  if (
    !(pre instanceof HTMLElement) ||
    pre.tagName !== "PRE" ||
    rest.length > 0 ||
    pre.childElementCount > 0
  ) {
    return false;
  }

  return (
    pre.attributes.length === 1 &&
    pre.style.whiteSpace === "pre-wrap" &&
    pre.style.overflowWrap === "break-word"
  );
}

/**
 * Unified extension for handling markdown input via paste and file drop
 * Handles three scenarios:
 * 1. Text paste: Detects and parses markdown text from clipboard
 * 2. File drop: Handles dropped markdown files
 * 3. File paste: Handles pasted markdown files from clipboard
 */
export const MarkdownInput = Extension.create({
  name: "markdownInput",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownInput"),
        props: {
          handlePaste: (_view: EditorView, event: ClipboardEvent) => {
            const { editor } = this;
            const data = event.clipboardData;
            if (!data) {
              return false;
            }

            const markdownFiles = Array.from(data.files).filter(isMarkdownFile);
            if (markdownFiles.length > 0) {
              event.preventDefault();
              insertMarkdownFiles(editor, markdownFiles);
              return true;
            }

            const text = data.getData("text/plain");
            if (!looksLikeMarkdown(text)) {
              return false;
            }

            // Rich HTML (a web page, Google Docs) pastes better as HTML
            if (data.getData("text/html") && !isWrappedPlainText(data)) {
              return false;
            }

            return insertMarkdown(editor, text);
          },

          handleDrop: (_view: EditorView, event: DragEvent, _slice, moved) => {
            // Don't handle if this is a move within the editor
            if (moved) {
              return false;
            }

            const files = Array.from(event.dataTransfer?.files || []);
            const markdownFiles = files.filter(isMarkdownFile);

            if (markdownFiles.length === 0) {
              // Let other plugins handle this
              return false;
            }

            // Prevent default browser behavior
            event.preventDefault();
            insertMarkdownFiles(this.editor, markdownFiles);
            return true;
          },
        },
      }),
    ];
  },
});
