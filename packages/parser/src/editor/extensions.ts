import {
  type AnyExtension,
  mergeAttributes,
  Node as TiptapNode,
} from "@tiptap/core";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import { Youtube } from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import type { ParseableElement } from "./types";

const queryHtml = (element: HTMLElement, selector: string) =>
  (element as ParseableElement).querySelector(selector);

const linkedMediaHref = (element: HTMLElement, selector: string) => {
  const media = queryHtml(element, selector);
  const parent = media?.parentElement;

  return parent?.tagName === "A" ? parent.getAttribute("href") : null;
};

/**
 * Server-side version of Marble's editor figure node.
 *
 * The CMS editor renders this node through React, but API/parser code only
 * needs a stable schema plus HTML parse/render behavior. Keeping it here lets
 * `htmlToTiptap` preserve image captions, links, width, and alignment.
 */
const ServerFigure = TiptapNode.create({
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
          queryHtml(element, "img")?.getAttribute("src") ||
          queryHtml(element, "a img")?.getAttribute("src"),
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: "",
        parseHTML: (element) =>
          queryHtml(element, "img")?.getAttribute("alt") ||
          queryHtml(element, "a img")?.getAttribute("alt") ||
          "",
        renderHTML: (attributes) => ({ alt: attributes.alt }),
      },
      caption: {
        default: null,
        renderHTML: () => null,
      },
      href: {
        default: null,
        parseHTML: (element) => linkedMediaHref(element, "img"),
        renderHTML: (attributes) => ({ href: attributes.href }),
      },
      width: {
        default: "100",
        parseHTML: (element) => element.getAttribute("data-width") || "100",
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
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
          return queryHtml(element, "img") ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, alt, href, ...figureAttrs } = HTMLAttributes;
    const caption = node.attrs.caption;
    const imgAttrs: Record<string, string> = {};

    if (src) {
      imgAttrs.src = src;
    }
    if (alt) {
      imgAttrs.alt = alt;
    }

    const image = href ? ["a", { href }, ["img", imgAttrs]] : ["img", imgAttrs];

    if (node.content.size === 0) {
      return [
        "figure",
        mergeAttributes(figureAttrs),
        image,
        ["figcaption", {}, caption || ""],
      ];
    }

    return [
      "figure",
      mergeAttributes(figureAttrs),
      image,
      ["figcaption", {}, 0],
    ];
  },
});

/**
 * Server-side version of Marble's self-hosted video node.
 */
const ServerVideo = TiptapNode.create({
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
          queryHtml(element, "video")?.getAttribute("src") ||
          queryHtml(element, "video source")?.getAttribute("src") ||
          element.getAttribute("src"),
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          queryHtml(element, "figcaption")?.textContent || "",
        renderHTML: (attributes) => ({ caption: attributes.caption }),
      },
      width: {
        default: "100",
        parseHTML: (element) => element.getAttribute("data-width") || "100",
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
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
          return queryHtml(element, "video") ? {} : false;
        },
      },
      { tag: "video" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, ...figureAttrs } = HTMLAttributes;
    const videoAttrs: Record<string, string> = { controls: "true" };

    if (src) {
      videoAttrs.src = src;
    }

    return [
      "figure",
      mergeAttributes({ "data-type": "video" }, figureAttrs),
      ["video", videoAttrs],
      ["figcaption", {}, caption || ""],
    ];
  },
});

/**
 * Server-side version of Marble's X/Twitter embed node.
 */
const ServerTwitter = TiptapNode.create({
  name: "twitter",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-src"),
        renderHTML: (attributes) =>
          attributes.src ? { "data-src": attributes.src } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-twitter]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-twitter": "" }, HTMLAttributes)];
  },
});

/**
 * Extensions used by server-side parser code. This mirrors the editor's schema
 * closely enough for API conversions without importing React node views.
 */
export const htmlExtensions: AnyExtension[] = [
  StarterKit.configure({
    link: {
      openOnClick: false,
    },
  }),
  Typography,
  Highlight,
  TextStyleKit,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Superscript,
  Subscript,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  Youtube.configure({
    controls: true,
    nocookie: false,
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
  ServerFigure,
  ServerVideo,
  ServerTwitter,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
];
