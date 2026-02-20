import sanitize, { defaults } from "sanitize-html";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses the same configuration as the CMS editor to ensure consistency.
 *
 * - Strips `<script>` tags and `on*` event handlers
 * - Whitelists safe HTML tags and attributes
 * - Only allows safe URL schemes (blocks `javascript:` in hrefs)
 * - Restricts iframe sources to YouTube only
 */
export const sanitizeHtml = (content: string): string => {
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
      code: ["class"],
      a: ["href", "target"],
      iframe: ["src", "allowfullscreen", "style"],
      input: ["type", "checked"],
      figure: [
        "src",
        "alt",
        "data-width",
        "caption",
        "data-align",
        "data-type",
      ],
      video: ["src", "controls", "preload", "muted", "loop", "playsinline"],
      track: ["kind", "src", "srclang", "label"],
      div: ["data-twitter", "data-src"],
      span: ["style", "data-color"],
      mark: ["style", "data-color"],
    },
    allowedStyles: {
      "*": {
        color: [
          /^#[\da-fA-F]{3,6}$/,
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
          /^[a-zA-Z]+$/,
        ],
        "background-color": [
          /^#[\da-fA-F]{3,6}$/,
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
          /^[a-zA-Z]+$/,
        ],
        "text-decoration": [/^line-through$/, /^underline$/, /^none$/],
      },
    },
    allowedSchemes: ["http", "https", "ftp", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      video: ["http", "https"],
      a: ["http", "https", "ftp", "mailto"],
      iframe: ["https"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
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
};
