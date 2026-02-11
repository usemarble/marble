import type { CommandProps } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoView } from "./video-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: {
        src: string;
        caption?: string;
        width?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
      updateVideo: (attrs: {
        caption?: string;
        width?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
    };
  }
}

export const Video = Node.create({
  name: "video",
  group: "block",
  content: "",
  draggable: true,
  selectable: true,
  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) =>
          element.querySelector("video")?.getAttribute("src") ||
          element.querySelector("video source")?.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("figcaption")?.textContent || "",
        renderHTML: (attributes) => ({
          caption: attributes.caption,
        }),
      },
      width: {
        default: "100",
        parseHTML: (element) => element.getAttribute("data-width") || "100",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }
          const video = element.querySelector("video");
          return video ? {} : false;
        },
      },
      {
        tag: "video",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }
          return {
            src: element.getAttribute("src"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, ...figureAttrs } = HTMLAttributes;

    const videoAttrs: Record<string, string> = { controls: "true" };
    if (src) {
      videoAttrs.src = src;
    }

    const figcaptionContent = caption || "";

    return [
      "figure",
      mergeAttributes({ "data-type": "video" }, figureAttrs),
      ["video", videoAttrs],
      ["figcaption", {}, figcaptionContent],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
      updateVideo:
        (attrs) =>
        ({ commands, tr, state }: CommandProps) => {
          const { selection } = state;
          const node = tr.doc.nodeAt(selection.from);

          if (node?.type.name === this.name) {
            return commands.updateAttributes(this.name, attrs);
          }

          return false;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
  },
});
