import { mergeAttributes } from "@tiptap/core";
import {
  Audio as NativeAudio,
  sanitizeAudioSrc,
} from "@tiptap/extension-audio";

export const AudioFigure = NativeAudio.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("figcaption")?.textContent || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const player = element.querySelector("audio");
          if (!player) {
            return false;
          }
          return {
            src:
              player.getAttribute("src") ||
              player.querySelector("source")?.getAttribute("src"),
            controls: player.hasAttribute("controls"),
            preload: player.getAttribute("preload") || "metadata",
            muted: player.hasAttribute("muted"),
            loop: player.hasAttribute("loop"),
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
