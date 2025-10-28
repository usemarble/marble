import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { looksLikeMarkdown, transformContent } from "./utils";

export const MarkdownPaste = Extension.create({
	name: "markdownPaste",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("markdownPaste"),
				props: {
					handlePaste: (view, event) => {
						const { editor } = this;

						// Get plain text from clipboard
						const text = event.clipboardData?.getData("text/plain");

						if (!text) {
							return false;
						}

						// Check if it looks like markdown
						if (!looksLikeMarkdown(text)) {
							return false;
						}

						// Prevent default paste behavior
						event.preventDefault();

						try {
							// Parse markdown to JSON using Tiptap's markdown extension
							const json = editor.markdown.parse(text);

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
				},
			}),
		];
	},
});
