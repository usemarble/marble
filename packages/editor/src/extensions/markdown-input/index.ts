import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { looksLikeMarkdown, transformContent } from "./utils";

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

            // First, check for markdown files in clipboard
            const files = Array.from(event.clipboardData?.files || []);
            const markdownFiles = files.filter(
              (file) =>
                file.name.endsWith(".md") ||
                file.name.endsWith(".markdown") ||
                file.type === "text/markdown"
            );

            if (markdownFiles.length > 0) {
              // Handle pasted markdown files
              event.preventDefault();

              for (const file of markdownFiles) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const text = e.target?.result as string;
                  if (text) {
                    try {
                      const json = editor?.markdown?.parse(text);
                      if (json) {
                        const transformedContent = transformContent(json);
                        editor.commands.insertContent(transformedContent);
                      }
                    } catch (error) {
                      console.error("Failed to parse markdown file:", error);
                    }
                  }
                };
                reader.readAsText(file);
              }

              return true;
            }

            // If no files, check if clipboard text looks like markdown
            const text = event.clipboardData?.getData("text/plain");

            if (!text) {
              return false;
            }

            if (!looksLikeMarkdown(text)) {
              return false;
            }

            // Prevent default paste behavior
            event.preventDefault();

            try {
              // Parse markdown to JSON using Tiptap's markdown extension
              const json = editor?.markdown?.parse(text) ?? {
                type: "doc",
                content: [],
              };

              // Transform Image nodes to Figure nodes
              const transformedContent = transformContent(json);

              // Insert the parsed and transformed content
              editor.commands.insertContent(transformedContent);

              return true;
            } catch (error) {
              console.error("Failed to parse markdown:", error);
              // Fall back to default paste behavior
              return false;
            }
          },

          handleDrop: (_view: EditorView, event: DragEvent, _slice, moved) => {
            // Don't handle if this is a move within the editor
            if (moved) {
              return false;
            }

            const { editor } = this;
            const files = Array.from(event.dataTransfer?.files || []);

            // Check if any files are markdown files
            const markdownFiles = files.filter(
              (file) =>
                file.name.endsWith(".md") ||
                file.name.endsWith(".markdown") ||
                file.type === "text/markdown"
            );

            if (markdownFiles.length === 0) {
              // Let other plugins handle this
              return false;
            }

            // Prevent default browser behavior
            event.preventDefault();

            // Process all markdown files
            for (const file of markdownFiles) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const text = e.target?.result as string;
                if (text) {
                  try {
                    // Parse markdown to JSON
                    const json = editor?.markdown?.parse(text);
                    if (json) {
                      // Transform Image nodes to Figure nodes
                      const transformedContent = transformContent(json);
                      // Insert at drop position
                      editor.commands.insertContent(transformedContent);
                    }
                  } catch (error) {
                    console.error("Failed to parse markdown file:", error);
                  }
                }
              };
              reader.readAsText(file);
            }

            // Return true to indicate we handled this event
            return true;
          },
        },
      }),
    ];
  },
});
