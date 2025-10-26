import { computePosition, flip, offset, shift } from "@floating-ui/dom";
// import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
	type SuggestionKeyDownProps,
	type SuggestionProps,
} from "@tiptap/suggestion";
import { GROUPS } from "./groups";
import { MenuList } from "./menu-list";

const extensionName = "slashCommand";

export const SlashCommand = Extension.create({
	name: extensionName,

	priority: 200,

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				char: "/",
				allowSpaces: true,
				startOfLine: false,
				pluginKey: new PluginKey(extensionName),
				allow: ({ state }) => {
					// Check if cursor is inside a table by examining the document structure
					const $from = state.selection.$from;

					// Check the parent node directly
					if (
						$from.parent.type.name === "tableCell" ||
						$from.parent.type.name === "tableHeader"
					) {
						return false; // Disable slash command inside tables
					}

					// Also check ancestors in case we're nested deeper
					for (let d = $from.depth; d > 0; d--) {
						const nodeName = $from.node(d).type.name;
						if (nodeName === "tableCell" || nodeName === "tableHeader") {
							return false; // Disable slash command inside tables
						}
					}

					return true; // Allow slash command everywhere else
				},
				command: ({ editor, props }) => {
					const { view, state } = editor;
					const { $head, $from } = view.state.selection;

					const end = $from.pos;
					const from = $head?.nodeBefore
						? end -
							($head.nodeBefore.text?.substring(
								$head.nodeBefore.text?.indexOf("/"),
							).length ?? 0)
						: $from.start();

					const tr = state.tr.deleteRange(from, end);
					view.dispatch(tr);

					props.action(editor);
					view.focus();
				},
				items: ({ query }: { query: string }) => {
					const withFilteredCommands = GROUPS.map((group) => ({
						...group,
						commands: group.commands
							.filter((item) => {
								const labelNormalized = item.label.toLowerCase().trim();
								const queryNormalized = query.toLowerCase().trim();

								if (item.aliases) {
									const aliases = item.aliases.map((alias) =>
										alias.toLowerCase().trim(),
									);

									return (
										labelNormalized.includes(queryNormalized) ||
										aliases.includes(queryNormalized)
									);
								}

								return labelNormalized.includes(queryNormalized);
							})
							.filter((command) =>
								command.shouldBeHidden
									? !command.shouldBeHidden(this.editor)
									: true,
							),
					}));

					const withoutEmptyGroups = withFilteredCommands.filter((group) => {
						if (group.commands.length > 0) {
							return true;
						}

						return false;
					});

					return withoutEmptyGroups;
				},
				render: () => {
					let component: {
						updateProps: (props: SuggestionProps) => void;
						destroy: () => void;
						element: HTMLElement;
						ref?: {
							onKeyDown?: (props: { event: KeyboardEvent }) => boolean;
						} | null;
					} | null = null;
					let popup: HTMLElement | null = null;
					let popupContainer: HTMLDivElement | null = null;
					let isDestroyed = false;

					return {
						onStart: (props: SuggestionProps) => {
							// Reset destroyed flag for new menu session
							isDestroyed = false;

							component = new ReactRenderer(MenuList, {
								props,
								editor: props.editor,
							});

							if (!props.clientRect) {
								return;
							}

							const rect = props.clientRect();
							if (!rect) {
								return;
							}

							// Create a dedicated container div for stability
							popupContainer = document.createElement("div");
							popupContainer.setAttribute("contenteditable", "false");
							popupContainer.style.position = "absolute";
							popupContainer.style.top = "0";
							popupContainer.style.left = "0";
							popupContainer.style.zIndex = "50";
							popupContainer.style.opacity = "0";
							popupContainer.style.transition = "opacity 0.1s";

							// Prevent mousedown from causing editor to lose focus
							popupContainer.addEventListener("mousedown", (e) => {
								e.preventDefault();
								e.stopPropagation();
							});

							// Mount the React component inside the container
							if (!component) {
								return;
							}
							popup = component.element;
							popupContainer.appendChild(popup);
							document.body.appendChild(popupContainer);

							// Create virtual element for Floating UI
							const virtualElement = {
								getBoundingClientRect: () => rect,
							};

							// Use Floating UI for positioning
							computePosition(virtualElement, popupContainer, {
								placement: "bottom-start",
								middleware: [
									offset({ mainAxis: 8, crossAxis: 0 }),
									flip(),
									shift({ padding: 8 }),
								],
							}).then(({ x, y }) => {
								if (popupContainer && !isDestroyed) {
									Object.assign(popupContainer.style, {
										left: `${x}px`,
										top: `${y}px`,
										opacity: "1",
									});
								}
							});
						},

						onUpdate(props: SuggestionProps) {
							if (isDestroyed || !component || !popupContainer) {
								return;
							}

							component.updateProps(props);

							if (!props.clientRect || !popupContainer) {
								return;
							}

							const rect = props.clientRect();
							if (!rect) {
								return;
							}

							const virtualElement = {
								getBoundingClientRect: () => rect,
							};

							computePosition(virtualElement, popupContainer, {
								placement: "bottom-start",
								middleware: [
									offset({ mainAxis: 8, crossAxis: 0 }),
									flip(),
									shift({ padding: 8 }),
								],
							}).then(({ x, y }) => {
								if (popupContainer && !isDestroyed) {
									Object.assign(popupContainer.style, {
										left: `${x}px`,
										top: `${y}px`,
									});
								}
							});
						},

						onKeyDown(props: SuggestionKeyDownProps) {
							if (props.event.key === "Escape") {
								if (!isDestroyed && popupContainer) {
									popupContainer.remove();
									popupContainer = null;
								}
								if (!isDestroyed) {
									component?.destroy();
									component = null;
									popup = null;
									isDestroyed = true;
								}
								return true;
							}

							return component?.ref?.onKeyDown?.(props) || false;
						},

						onExit() {
							if (isDestroyed) {
								return;
							}

							if (popupContainer) {
								popupContainer.remove();
								popupContainer = null;
							}
							component?.destroy();
							component = null;
							popup = null;
							isDestroyed = true;
						},
					};
				},
			}),
		];
	},
});

export default SlashCommand;
