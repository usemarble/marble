import type { CommandProps } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureView } from "./figure-view";

const captionToContent = (caption?: string) =>
  caption
    ? [
        {
          type: "paragraph",
          content: [{ type: "text", text: caption }],
        },
      ]
    : [{ type: "paragraph" }];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: {
        src: string;
        alt?: string;
        caption?: string;
        href?: string;
        width?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
      updateFigure: (attrs: {
        alt?: string;
        caption?: string;
        href?: string;
        width?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
    };
  }
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "paragraph?",
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
          // Return attribute to make it available in HTMLAttributes
          // Main renderHTML will apply it to img element
          return { src: attributes.src };
        },
      },
      alt: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("alt") ||
          element.querySelector("a img")?.getAttribute("alt") ||
          "",
        renderHTML: (attributes) => {
          // Return attribute to make it available in HTMLAttributes
          // Main renderHTML will apply it to img element
          return { alt: attributes.alt };
        },
      },
      caption: {
        default: null,
        renderHTML: () => null,
      },
      href: {
        default: null,
        parseHTML: (element) => {
          const img = element.querySelector("img");
          const parent = img?.parentElement;

          return parent?.tagName === "A" ? parent.getAttribute("href") : null;
        },
        renderHTML: (attributes) => {
          // Return attribute to make it available in HTMLAttributes
          // Main renderHTML will apply it to anchor element
          return { href: attributes.href };
        },
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
        contentElement: "figcaption",
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

  renderHTML({ HTMLAttributes, node }) {
    const { src, alt, href, ...figureAttrs } = HTMLAttributes;
    const caption = node.attrs.caption;

    // Prepare img attributes
    const imgAttrs: Record<string, string> = {};
    if (src) {
      imgAttrs.src = src;
    }
    if (alt) {
      imgAttrs.alt = alt;
    }

    // If href exists, wrap img in anchor tag
    const image = href ? ["a", { href }, ["img", imgAttrs]] : ["img", imgAttrs];

    if (node.content.size === 0) {
      return [
        "figure",
        mergeAttributes(figureAttrs),
        image,
        ["figcaption", {}, caption || ""],
      ];
    }

    if (href) {
      return [
        "figure",
        mergeAttributes(figureAttrs),
        image,
        ["figcaption", {}, 0],
      ];
    }

    // Otherwise, render img directly
    return [
      "figure",
      mergeAttributes(figureAttrs),
      image,
      ["figcaption", {}, 0],
    ];
  },

  addCommands() {
    return {
      setFigure:
        (options) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              caption: null,
            },
            content: captionToContent(options.caption),
          }),
      updateFigure:
        (attrs) =>
        ({ commands, tr, state }: CommandProps) => {
          const { selection } = state;
          const node = tr.doc.nodeAt(selection.from);

          if (node?.type.name === this.name) {
            const { caption: _caption, ...nodeAttrs } = attrs;
            return commands.updateAttributes(this.name, nodeAttrs);
          }

          return false;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});
