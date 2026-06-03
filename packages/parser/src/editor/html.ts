import { getSchema, type JSONContent } from "@tiptap/core";
import { parseHTML } from "linkedom";
import { DOMParser as PMDOMParser } from "prosemirror-model";
import { htmlExtensions } from "./extensions";
import { EMPTY_TIPTAP_DOC } from "./types";

type MarkdownElement = HTMLElement & {
  childNodes: NodeListOf<ChildNode>;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
  querySelector: (selector: string) => MarkdownElement | null;
  querySelectorAll: (selector: string) => NodeListOf<MarkdownElement>;
};

const blockNodes = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "DL",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "UL",
]);

const escapeMarkdown = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[")
    .replace(/]/g, "\\]");

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ");

const isElement = (node: ChildNode): node is MarkdownElement =>
  node.nodeType === 1;

const isText = (node: ChildNode) => node.nodeType === 3;

const childrenToMarkdown = (element: MarkdownElement) =>
  Array.from(element.childNodes)
    .map((child) => nodeToMarkdown(child))
    .join("");

const block = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}\n\n` : "";
};

const rawHtmlBlock = (element: MarkdownElement) => block(element.outerHTML);

const imageMarkdown = (image: MarkdownElement) => {
  const src = image.getAttribute("src");
  const alt = image.getAttribute("alt") || "";

  if (!src) {
    return "";
  }

  return `![${escapeMarkdown(alt)}](${src})`;
};

const tableCellText = (cell: MarkdownElement) =>
  normalizeWhitespace(childrenToMarkdown(cell)).replace(/\|/g, "\\|").trim();

const tableToMarkdown = (table: MarkdownElement) => {
  const rows = Array.from(
    table.querySelectorAll("tr") as unknown as MarkdownElement[]
  );

  if (rows.length === 0) {
    return "";
  }

  const serializedRows = rows.map((row) =>
    Array.from(
      row.querySelectorAll("th,td") as unknown as MarkdownElement[]
    ).map(tableCellText)
  );
  const maxCells = Math.max(...serializedRows.map((row) => row.length));
  const header = serializedRows[0] || [];
  const normalizedHeader = Array.from(
    { length: maxCells },
    (_, index) => header[index] || ""
  );
  const separator = Array.from({ length: maxCells }, () => "---");
  const bodyRows = serializedRows.slice(1);
  const rowToMarkdown = (row: string[]) =>
    `| ${Array.from({ length: maxCells }, (_, index) => row[index] || "").join(" | ")} |`;

  return block(
    [rowToMarkdown(normalizedHeader), rowToMarkdown(separator)]
      .concat(bodyRows.map(rowToMarkdown))
      .join("\n")
  );
};

const listToMarkdown = (list: MarkdownElement, ordered: boolean) => {
  const items = Array.from(list.childNodes).filter(
    (child): child is MarkdownElement =>
      isElement(child) && child.nodeName === "LI"
  );

  return block(
    items
      .map((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const marker = ordered ? `${index + 1}.` : "-";
        const taskMarker = checkbox
          ? `[${checkbox.hasAttribute("checked") ? "x" : " "}] `
          : "";
        const text = normalizeWhitespace(childrenToMarkdown(item)).trim();
        return `${marker} ${taskMarker}${text}`;
      })
      .join("\n")
  );
};

const nodeToMarkdown = (node: ChildNode): string => {
  if (isText(node)) {
    const text = node.textContent || "";
    return /^\s+$/.test(text) ? "" : escapeMarkdown(normalizeWhitespace(text));
  }

  if (!isElement(node)) {
    return "";
  }

  switch (node.nodeName) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      const level = Number(node.nodeName.slice(1));
      return block(`${"#".repeat(level)} ${childrenToMarkdown(node).trim()}`);
    }
    case "P":
      return block(childrenToMarkdown(node));
    case "STRONG":
    case "B":
      return `**${childrenToMarkdown(node).trim()}**`;
    case "EM":
    case "I":
      return `*${childrenToMarkdown(node).trim()}*`;
    case "S":
    case "DEL":
      return `~~${childrenToMarkdown(node).trim()}~~`;
    case "CODE":
      if (node.parentElement?.nodeName === "PRE") {
        return node.textContent || "";
      }
      return `\`${node.textContent || ""}\``;
    case "PRE": {
      const code = node.querySelector("code");
      const languageClass = code?.getAttribute("class") || "";
      const language = languageClass.replace(/^language-/, "");
      const codeText = (code?.textContent || node.textContent || "").replace(
        /\n+$/,
        ""
      );
      return block(`\`\`\`${language}\n${codeText}\n\`\`\``);
    }
    case "A": {
      const href = node.getAttribute("href");
      const text = childrenToMarkdown(node).trim();
      return href ? `[${text}](${href})` : text;
    }
    case "IMG":
      return imageMarkdown(node);
    case "BR":
      return "\n";
    case "HR":
      return "---\n\n";
    case "BLOCKQUOTE":
      return block(
        childrenToMarkdown(node)
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n")
      );
    case "UL":
      return listToMarkdown(node, false);
    case "OL":
      return listToMarkdown(node, true);
    case "TABLE":
      return tableToMarkdown(node);
    case "FIGURE":
      return rawHtmlBlock(node);
    case "DIV":
      if (
        node.hasAttribute("data-youtube-video") ||
        node.hasAttribute("data-twitter")
      ) {
        return rawHtmlBlock(node);
      }
      return block(childrenToMarkdown(node));
    default: {
      const content = childrenToMarkdown(node);
      return blockNodes.has(node.nodeName) ? block(content) : content;
    }
  }
};

/**
 * Converts sanitized editor HTML into Tiptap JSON using Marble's server-side
 * schema. Custom editor nodes such as figures, videos, Twitter embeds, and
 * YouTube iframes are preserved when their HTML matches the extension rules.
 */
export function htmlToTiptap(html: string): JSONContent {
  if (!html.trim()) {
    return EMPTY_TIPTAP_DOC;
  }

  const schema = getSchema(htmlExtensions);
  const { document } = parseHTML(
    `<!doctype html><html><body>${html}</body></html>`
  );

  return PMDOMParser.fromSchema(schema)
    .parse(document.body as unknown as Node)
    .toJSON();
}

/**
 * Converts editor HTML to Markdown while preserving Marble-specific embeds as
 * raw HTML when Markdown has no faithful representation.
 */
export function htmlToMarkdown(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const { document } = parseHTML(
    `<!doctype html><html><body>${html}</body></html>`
  );

  return Array.from(document.body.childNodes)
    .map((child) => nodeToMarkdown(child))
    .join("")
    .trim();
}
