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
        href?: string;
        width?: string;
        height?: string;
        widthUnit?: "percent" | "pixel";
        align?: "left" | "center" | "right";
      }) => ReturnType;
      updateFigure: (attrs: {
        alt?: string;
        caption?: string;
        href?: string;
        width?: string;
        height?: string;
        widthUnit?: "percent" | "pixel";
        align?: "left" | "center" | "right";
      }) => ReturnType;
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
          element.querySelector("img")?.getAttribute("src") ||
          element.querySelector("a img")?.getAttribute("src"),
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
          element.querySelector("img")?.getAttribute("alt") ||
          element.querySelector("a img")?.getAttribute("alt") ||
          "",
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
      href: {
        default: null,
        parseHTML: (element) =>
          element.querySelector("a")?.getAttribute("href") || null,
        renderHTML: (attributes) => ({
          href: attributes.href,
        }),
      },
      width: {
        default: "100",
        parseHTML: (element) =>
          element.getAttribute("data-width") || "100",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
        }),
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-height") || null,
        renderHTML: (attributes) => ({
          "data-height": attributes.height,
        }),
      },
      widthUnit: {
        default: "percent",
        parseHTML: (element) =>
          element.getAttribute("data-width-unit") || "percent",
        renderHTML: (attributes) => ({
          "data-width-unit": attributes.widthUnit,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-align") || "center",
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
          const img = element.querySelector("img");
          return img ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { href, ...attrs } = HTMLAttributes;

    // If href exists, wrap img in anchor tag
    if (href) {
      return [
        "figure",
        mergeAttributes(attrs),
        ["a", { href }, ["img"]],
        ["figcaption"],
      ];
    }

    // Otherwise, render img directly
    return ["figure", mergeAttributes(attrs), ["img"], ["figcaption"]];
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
