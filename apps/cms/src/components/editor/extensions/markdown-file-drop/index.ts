import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { transformContent } from "../markdown-paste/utils";

export const MarkdownFileDrop = Extension.create({
  name: "markdownFileDrop",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownFileDrop"),
        props: {
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

          handlePaste: (_view: EditorView, event: ClipboardEvent) => {
            const { editor } = this;
            const files = Array.from(event.clipboardData?.files || []);

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

            // Prevent default paste behavior
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
                      // Insert at cursor
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
