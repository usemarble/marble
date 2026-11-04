import { parseAudioSources } from "@marble/utils/media";
import { mergeAttributes } from "@tiptap/core";
import {
  Audio as NativeAudio,
  sanitizeAudioSrc,
} from "@tiptap/extension-audio";
import type { DOMOutputSpec } from "prosemirror-model";
import type { ParseableElement } from "./types";

const queryHtml = (element: HTMLElement, selector: string) =>
  (element as unknown as ParseableElement).querySelector(selector);

export const ServerAudio = NativeAudio.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      sources: { default: [], renderHTML: () => null },
      caption: {
        default: "",
        parseHTML: (element) =>
          queryHtml(element, "figcaption")?.textContent || "",
      },
    };
  },

  parseHTML() {
    const getAttrs = (element: HTMLElement) => {
      const root = element as unknown as ParseableElement;
      const player =
        root.tagName.toLowerCase() === "audio"
          ? root
          : root.querySelector("audio");
      if (!player) {
        return false;
      }
      return {
        src: player.getAttribute("src"),
        sources: Array.from(player.querySelectorAll("source"), (source) => ({
          src: source.getAttribute("src") || "",
          type: source.getAttribute("type") ?? undefined,
        })),
        controls: player.getAttribute("controls") !== null,
        preload: player.getAttribute("preload") || "metadata",
        muted: player.getAttribute("muted") !== null,
        loop: player.getAttribute("loop") !== null,
      };
    };
    return [
      { tag: "figure", getAttrs },
      {
        tag: this.options.allowBase64 ? "audio" : 'audio:not([src^="data:"])',
        getAttrs,
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { caption, ...attributes } = HTMLAttributes;
    const playerAttributes = mergeAttributes(
      this.options.HTMLAttributes,
      attributes,
      {
        src: sanitizeAudioSrc(attributes.src, this.options.allowBase64),
      }
    );
    const sourceElements = parseAudioSources(node.attrs.sources).flatMap(
      (source): DOMOutputSpec[] => {
        const src = sanitizeAudioSrc(source.src, this.options.allowBase64);
        return src
          ? [["source", { src, ...(source.type ? { type: source.type } : {}) }]]
          : [];
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
        ...sourceElements,
      ],
      ["figcaption", {}, caption || ""],
    ];
  },
});
