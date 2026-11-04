import { mergeAttributes } from "@tiptap/core";
import {
  Audio as NativeAudio,
  sanitizeAudioSrc,
} from "@tiptap/extension-audio";
import type { ParseableElement } from "./types";

const queryHtml = (element: HTMLElement, selector: string) =>
  (element as unknown as ParseableElement).querySelector(selector);

export const ServerAudio = NativeAudio.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: "",
        parseHTML: (element) =>
          queryHtml(element, "figcaption")?.textContent || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const player = queryHtml(element, "audio");
          if (!player) {
            return false;
          }
          return {
            src:
              player.getAttribute("src") ||
              player.querySelector("source")?.getAttribute("src"),
            controls: player.getAttribute("controls") !== null,
            preload: player.getAttribute("preload") || "metadata",
            muted: player.getAttribute("muted") !== null,
            loop: player.getAttribute("loop") !== null,
          };
        },
      },
      ...(this.parent?.() ?? []),
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...attributes } = HTMLAttributes;
    const playerAttributes = mergeAttributes(
      this.options.HTMLAttributes,
      attributes,
      {
        src: sanitizeAudioSrc(attributes.src, this.options.allowBase64),
      }
    );
    return [
      "figure",
      { "data-type": "audio" },
      [
        "audio",
        Object.fromEntries(
          Object.entries(playerAttributes).filter(
            ([, value]) =>
              value !== false && value !== null && value !== undefined
          )
        ),
      ],
      ["figcaption", {}, caption || ""],
    ];
  },
});
