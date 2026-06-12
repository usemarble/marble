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
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import Fuse from "fuse.js";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SlashNodeAttrs, SuggestionItem } from "../../types";
import { defaultSlashSuggestions } from "./groups";
import { EditorSlashMenu, type EditorSlashMenuHandle } from "./menu-list";

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
        // The menu is rendered into its own React root, detached from the
        // app's React tree. Rendering it through `ReactRenderer` makes it a
        // portal owned by `<EditorContent />`, so any re-render/remount of
        // the consuming app could silently unmount the menu while the
        // suggestion plugin still thinks it is open.
        let element: HTMLDivElement | null = null;
        let root: Root | null = null;
        let stopPositioning: (() => void) | undefined;
        let latestProps: SuggestionProps<SuggestionItem> | null = null;
        let lastRect: DOMRect | null = null;
        const menuHandle: { current: EditorSlashMenuHandle | null } = {
          current: null,
        };

        const getReferenceRect = () => {
          const rect = latestProps?.clientRect?.();
          // Keep the last known caret position instead of jumping to (0, 0)
          // when the decoration is briefly unavailable.
          if (rect && (rect.width || rect.height || rect.x || rect.y)) {
            lastRect = rect;
          }
          return lastRect ?? new DOMRect(-9999, -9999, 0, 0);
        };

        const renderMenu = () => {
          if (!(root && latestProps)) {
            return;
          }
          root.render(
            createElement(EditorSlashMenu, {
              editor: latestProps.editor,
              items: latestProps.items,
              range: latestProps.range,
              ref: (handle: EditorSlashMenuHandle | null) => {
                menuHandle.current = handle;
              },
            })
          );
        };

        const updatePosition = () => {
          if (!element) {
            return;
          }
          const referenceElement = {
            getBoundingClientRect: getReferenceRect,
            contextElement: latestProps?.editor.view.dom,
          };
          computePosition(referenceElement, element, {
            placement: "bottom-start",
            middleware: [
              offset(6),
              flip({ padding: 8 }),
              shift({ padding: 8 }),
            ],
          }).then(({ x, y }) => {
            if (element) {
              Object.assign(element.style, {
                left: `${x}px`,
                top: `${y}px`,
              });
            }
          });
        };

        const unmount = () => {
          stopPositioning?.();
          stopPositioning = undefined;
          element?.remove();
          element = null;
          menuHandle.current = null;
          latestProps = null;
          lastRect = null;
          const currentRoot = root;
          root = null;
          if (currentRoot) {
            // Avoid unmounting synchronously in case the suggestion plugin
            // fired during a React render.
            queueMicrotask(() => currentRoot.unmount());
          }
        };

        const mount = (props: SuggestionProps<SuggestionItem>) => {
          unmount();
          latestProps = props;

          element = document.createElement("div");
          Object.assign(element.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "max-content",
            zIndex: "50",
          });

          root = createRoot(element);
          renderMenu();
          document.body.appendChild(element);

          const referenceElement = {
            getBoundingClientRect: getReferenceRect,
            contextElement: props.editor.view.dom,
          };
          stopPositioning = autoUpdate(
            referenceElement,
            element,
            updatePosition
          );
        };

        return {
          onStart: (onStartProps) => {
            mount(onStartProps as SuggestionProps<SuggestionItem>);
          },

          onUpdate(onUpdateProps) {
            const props = onUpdateProps as SuggestionProps<SuggestionItem>;
            if (!(element && root)) {
              // Self-heal: if the menu got torn down while the suggestion is
              // still active, bring it back on the next update.
              mount(props);
              return;
            }
            latestProps = props;
            renderMenu();
            if (!element.isConnected) {
              document.body.appendChild(element);
            }
            updatePosition();
          },

          onKeyDown(onKeyDownProps) {
            if (onKeyDownProps.event.key === "Escape") {
              // The suggestion plugin dispatches the exit itself; teardown
              // happens in onExit.
              return true;
            }

            return (
              menuHandle.current?.onKeyDown({ event: onKeyDownProps.event }) ??
              false
            );
          },

          onExit() {
            unmount();
          },
        };
      },
    },
  });
