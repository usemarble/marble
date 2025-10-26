import sanitize, { defaults } from "sanitize-html";

export const sanitizeHtml = (content: string) => {
  const sanitizedContent = sanitize(content, {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "img",
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
    ],
    allowedAttributes: {
      ...defaults.allowedAttributes,
      "*": ["style"],
      code: ["class"],
      a: ["href", "target"],
      iframe: ["src", "allowfullscreen", "style"],
      input: ["type", "checked"],
    },
    allowedSchemes: ["http", "https", "ftp", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "ftp", "mailto"],
      iframe: ["https"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
    exclusiveFilter: (frame) => {
      // Remove script tags entirely
      if (frame.tag === "script") {
        return true;
      }
      // Remove any element with event handler attributes
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

  return sanitizedContent;
};
