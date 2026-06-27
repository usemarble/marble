import sanitize, { defaults } from "sanitize-html";

/**
 * Sanitizes full post/body HTML while preserving the tags and attributes
 * supported by Marble's editor and rendered content surfaces.
 */
export function sanitizeHtml(content: string): string {
  return sanitize(content, {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "img",
      "video",
      "track",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "code",
      "pre",
      "p",
      "li",
      "ul",
      "ol",
      "blockquote",
      "td",
      "th",
      "table",
      "tr",
      "tbody",
      "thead",
      "tfoot",
      "small",
      "div",
      "iframe",
      "input",
      "label",
      "figure",
      "figcaption",
      "span",
      "mark",
      "s",
      "u",
      "sub",
      "sup",
      "hr",
    ],
    allowedAttributes: {
      ...defaults.allowedAttributes,
      "*": ["style"],
      a: ["href", "target"],
      code: ["class"],
      div: ["data-twitter", "data-src", "data-youtube-video"],
      figure: [
        "src",
        "alt",
        "data-width",
        "caption",
        "data-align",
        "data-type",
      ],
      iframe: ["src", "allowfullscreen", "style", "width", "height"],
      input: ["type", "checked"],
      mark: ["style", "data-color"],
      span: ["style", "data-color"],
      track: ["kind", "src", "srclang", "label"],
      video: ["src", "controls", "preload", "muted", "loop", "playsinline"],
    },
    allowedStyles: {
      "*": {
        "background-color": [
          /^#[\da-fA-F]{3,6}$/,
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
          /^[a-zA-Z]+$/,
        ],
        color: [
          /^#[\da-fA-F]{3,6}$/,
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
          /^[a-zA-Z]+$/,
        ],
        "text-decoration": [/^line-through$/, /^underline$/, /^none$/],
      },
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
    allowedSchemes: ["http", "https", "ftp", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "ftp", "mailto"],
      iframe: ["https"],
      img: ["http", "https", "data"],
      video: ["http", "https"],
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "script") {
        return true;
      }

      if (frame.tag === "input" && frame.attribs?.type !== "checkbox") {
        return true;
      }

      if (frame.attribs) {
        for (const attr in frame.attribs) {
          if (/^on/i.test(attr)) {
            return true;
          }
        }
      }

      return false;
    },
  });
}

/**
 * Sanitizes custom rich-text field HTML, which supports a smaller inline
 * formatting surface than full post content.
 */
export function sanitizeRichTextHtml(content: string): string {
  return sanitize(content, {
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedTags: [
      "a",
      "b",
      "br",
      "em",
      "i",
      "li",
      "ol",
      "p",
      "strong",
      "u",
      "ul",
    ],
    exclusiveFilter: (frame) => {
      if (frame.tag === "script") {
        return true;
      }

      if (frame.attribs) {
        for (const attr in frame.attribs) {
          if (/^on/i.test(attr)) {
            return true;
          }
        }
      }

      return false;
    },
  });
}
