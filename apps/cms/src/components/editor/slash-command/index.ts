import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { filterItems, slashCommandItems } from "./items";
import { SlashCommandMenu } from "./menu";

const extensionName = "slashCommand";

let cleanup: (() => void) | null = null;

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
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          return filterItems(slashCommandItems, query);
        },
        render: () => {
          let component: ReactRenderer<
            { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
            SuggestionProps
          > | null = null;
          let popup: HTMLElement | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashCommandMenu, {
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

              // Create popup element
              popup = component.element;
              document.body.appendChild(popup);

              // Create virtual element for Floating UI
              const virtualElement = {
                getBoundingClientRect: () => rect,
              };

              // Use Floating UI for positioning
              const updatePosition = () => {
                if (!popup) {
                  return;
                }

                computePosition(virtualElement, popup, {
                  placement: "bottom-start",
                  middleware: [
                    offset({ mainAxis: 8, crossAxis: 0 }),
                    flip(),
                    shift({ padding: 8 }),
                  ],
                }).then(({ x, y }) => {
                  if (popup) {
                    Object.assign(popup.style, {
                      left: `${x}px`,
                      top: `${y}px`,
                      position: "absolute",
                      zIndex: "50",
                    });
                  }
                });
              };

              updatePosition();

              // Auto-update position on scroll/resize
              cleanup = autoUpdate(virtualElement, popup, updatePosition);
            },

            onUpdate(props: SuggestionProps) {
              component?.updateProps(props);

              if (!props.clientRect || !popup) {
                return;
              }

              const rect = props.clientRect();
              if (!rect) {
                return;
              }

              const virtualElement = {
                getBoundingClientRect: () => rect,
              };

              computePosition(virtualElement, popup, {
                placement: "bottom-start",
                middleware: [
                  offset({ mainAxis: 8, crossAxis: 0 }),
                  flip(),
                  shift({ padding: 8 }),
                ],
              }).then(({ x, y }) => {
                if (popup) {
                  Object.assign(popup.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                  });
                }
              });
            },

            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === "Escape") {
                if (cleanup) {
                  cleanup();
                  cleanup = null;
                }
                if (popup) {
                  popup.remove();
                }
                component?.destroy();
                return true;
              }

              return component?.ref?.onKeyDown?.(props) || false;
            },

            onExit() {
              if (cleanup) {
                cleanup();
                cleanup = null;
              }
              if (popup) {
                popup.remove();
              }
              component?.destroy();
              component = null;
              popup = null;
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommand;
