import type { CommandProps } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureView } from "./figure-view";

declare module "@tiptap/core" {
  // biome-ignore lint/style/useConsistentTypeDefinitions: Extending tiptap commands
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: {
        src: string;
        alt?: string;
        caption?: string;
      }) => ReturnType;
      updateFigure: (attrs: { alt?: string; caption?: string }) => ReturnType;
    };
  }
}

export const Figure = Node.create({
  name: "figure",
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
          element.querySelector("img")?.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            src: attributes.src,
          };
        },
      },
      alt: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("alt") || "",
        renderHTML: (attributes) => ({
          alt: attributes.alt,
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
          const img = element.querySelector("img");
          return img ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes), ["img"], ["figcaption"]];
  },

  addCommands() {
    return {
      setFigure:
        (options) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
      updateFigure:
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
    return ReactNodeViewRenderer(FigureView);
  },
});
