/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import { mergeAttributes, Node } from "@tiptap/core";
import type { DOMOutputSpec, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import Fuse from "fuse.js";
import type { EditorSlashMenuProps, SlashNodeAttrs } from "../../types";
import { defaultSlashSuggestions } from "./groups";
import { EditorSlashMenu, handleCommandNavigation } from "./menu-list";

const SlashPluginKey = new PluginKey("slash");

/**
 * Slash command options type
 */
export interface SlashOptions<
  SlashOptionSuggestionItem = unknown,
  Attrs = SlashNodeAttrs,
> {
  HTMLAttributes: Record<string, unknown>;
  renderText: (props: {
    options: SlashOptions<SlashOptionSuggestionItem, Attrs>;
    node: ProseMirrorNode;
  }) => string;
  renderHTML: (props: {
    options: SlashOptions<SlashOptionSuggestionItem, Attrs>;
    node: ProseMirrorNode;
  }) => DOMOutputSpec;
  deleteTriggerWithBackspace: boolean;
  suggestion: Omit<
    SuggestionOptions<SlashOptionSuggestionItem, Attrs>,
    "editor"
  >;
}

/**
 * Slash Command Extension
 * Allows users to type "/" to open a command menu with formatting options
 */
export const SlashCommand = Node.create<SlashOptions>({
  name: "slash",
  priority: 101,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderText({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
      },
      deleteTriggerWithBackspace: false,
      renderHTML({ options, node }) {
        return [
          "span",
          mergeAttributes(this.HTMLAttributes, options.HTMLAttributes),
          `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
        ];
      },
      suggestion: {
        char: "/",
        pluginKey: SlashPluginKey,
        command: ({ editor, range, props }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(" ");

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();

          // get reference to `window` object from editor element, to support cross-frame JS usage
          editor.view.dom.ownerDocument.defaultView
            ?.getSelection()
            ?.collapseToEnd();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);

          // Check if we're inside a table by looking at ancestor nodes
          let isInTable = false;
          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth);
            if (
              node.type.name === "table" ||
              node.type.name === "tableRow" ||
              node.type.name === "tableCell" ||
              node.type.name === "tableHeader"
            ) {
              isInTable = true;
              break;
            }
          }

          // Don't allow slash commands inside tables
          if (isInTable) {
            return false;
          }

          const isRootDepth = $from.depth === 1;
          const isParagraph = $from.parent.type.name === "paragraph";
          const isStartOfNode = $from.parent.textContent?.charAt(0) === "/";

          // Check if we're in a column (for column layouts) by checking ancestor nodes
          let isInColumn = false;
          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth);
            if (node.type.name === "column") {
              isInColumn = true;
              break;
            }
          }

          // Check if content after '/' is valid (not ending with double space)
          const afterContent = $from.parent.textContent?.substring(
            $from.parent.textContent?.indexOf("/") ?? 0
          );
          const isValidAfterContent = !afterContent?.endsWith("  ");

          // Only allow slash commands at root depth or in columns, and only in paragraphs at the start
          return (
            ((isRootDepth && isParagraph && isStartOfNode) ||
              (isInColumn && isParagraph && isStartOfNode)) &&
            isValidAfterContent
          );
        },
      },
    };
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "data-id": attributes.id,
          };
        },
      },

      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }

          return {
            "data-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const mergedOptions = { ...this.options };

    mergedOptions.HTMLAttributes = mergeAttributes(
      { "data-type": this.name },
      this.options.HTMLAttributes,
      HTMLAttributes
    );
    const html = this.options.renderHTML({
      options: mergedOptions,
      node,
    });

    if (typeof html === "string") {
      return [
        "span",
        mergeAttributes(
          { "data-type": this.name },
          this.options.HTMLAttributes,
          HTMLAttributes
        ),
        html,
      ];
    }
    return html;
  },

  renderText({ node }) {
    return this.options.renderText({
      options: this.options,
      node,
    });
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true;
              tr.insertText(
                this.options.deleteTriggerWithBackspace
                  ? ""
                  : this.options.suggestion.char || "",
                pos,
                pos + node.nodeSize
              );

              return false;
            }
          });

          return isMention;
        }),
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

/**
 * Configure slash command with default suggestions and Floating UI renderer
 */
export const configureSlashCommand = () =>
  SlashCommand.configure({
    suggestion: {
      items: async ({ editor, query }) => {
        if (!defaultSlashSuggestions) {
          return [];
        }
        const items = await defaultSlashSuggestions({ editor, query });

        if (!query) {
          return items;
        }

        const slashFuse = new Fuse(items, {
          keys: ["title", "description", "searchTerms"],
          threshold: 0.2,
          minMatchCharLength: 1,
        });

        const results = slashFuse.search(query);

        return results.map((result) => result.item);
      },
      char: "/",
      render: () => {
        let component: ReactRenderer<EditorSlashMenuProps>;
        let cleanup: (() => void) | undefined;

        return {
          onStart: (onStartProps) => {
            // Clean up any existing component first (prevents double rendering in Strict Mode)
            if (component) {
              if (cleanup) {
                cleanup();
              }
              if (component.element.parentNode) {
                component.element.parentNode.removeChild(component.element);
              }
              component.destroy();
            }

            component = new ReactRenderer(EditorSlashMenu, {
              props: onStartProps,
              editor: onStartProps.editor,
            });

            const referenceElement = {
              getBoundingClientRect: () =>
                onStartProps.clientRect?.() || new DOMRect(),
            };

            // Use Floating UI for positioning (Tiptap v3)
            cleanup = autoUpdate(
              referenceElement as any,
              component.element,
              () => {
                computePosition(referenceElement as any, component.element, {
                  placement: "bottom-start",
                  middleware: [offset(6), flip(), shift({ padding: 8 })],
                }).then(({ x, y }) => {
                  Object.assign(component.element.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                    position: "absolute",
                  });
                });
              }
            );

            // Only append if not already in DOM (prevents duplicates)
            if (!component.element.parentNode) {
              document.body.appendChild(component.element);
            }
          },

          onUpdate(onUpdateProps) {
            component.updateProps(onUpdateProps);
          },

          onKeyDown(onKeyDownProps) {
            if (onKeyDownProps.event.key === "Escape") {
              if (cleanup) {
                cleanup();
              }
              if (component.element.parentNode) {
                component.element.parentNode.removeChild(component.element);
              }
              component.destroy();

              return true;
            }

            return handleCommandNavigation(onKeyDownProps.event) ?? false;
          },

          onExit() {
            if (cleanup) {
              cleanup();
            }
            if (component.element.parentNode) {
              component.element.parentNode.removeChild(component.element);
            }
            component.destroy();
          },
        };
      },
    },
  });
