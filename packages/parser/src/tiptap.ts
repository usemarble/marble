import type { JSONContent } from "@tiptap/core";
import { marked, type Token, type Tokens } from "marked";

export class MarkdownToTiptapParser {
  private tokens: Token[] = [];

  constructor() {
    marked.setOptions({ gfm: true, breaks: true });
  }

  parse(markdown: string): JSONContent {
    this.tokens = marked.lexer(markdown);
    return { type: "doc", content: this.parseTokens(this.tokens) };
  }

  private parseTokens(tokens: Token[]): JSONContent[] {
    const content: JSONContent[] = [];
    for (const token of tokens) {
      const node = this.parseToken(token);
      if (node) {
        if (Array.isArray(node)) {
          content.push(...node);
        } else {
          content.push(node);
        }
      }
    }
    return content;
  }

  private parseToken(token: Token): JSONContent | JSONContent[] | null {
    switch (token.type) {
      case "heading":
        return MarkdownToTiptapParser.parseHeading(token as Tokens.Heading);
      case "paragraph":
        return MarkdownToTiptapParser.parseParagraph(token as Tokens.Paragraph);
      case "blockquote":
        return MarkdownToTiptapParser.parseBlockquote(
          token as Tokens.Blockquote
        );
      case "list":
        return MarkdownToTiptapParser.parseList(token as Tokens.List);
      case "code":
        return MarkdownToTiptapParser.parseCodeBlock(token as Tokens.Code);
      case "hr":
        return { type: "horizontalRule" };
      case "table":
        return MarkdownToTiptapParser.parseTable(token as Tokens.Table);
      case "html":
        return MarkdownToTiptapParser.parseHTML(token as Tokens.HTML);
      case "space":
        return null;
      default:
        return null;
    }
  }

  static parseHeading(token: Tokens.Heading): JSONContent {
    return {
      type: "heading",
      attrs: { level: token.depth },
      content: MarkdownToTiptapParser.parseInlineTokens(token.tokens || []),
    };
  }

  static parseParagraph(token: Tokens.Paragraph): JSONContent {
    return {
      type: "paragraph",
      content: MarkdownToTiptapParser.parseInlineTokens(token.tokens || []),
    };
  }

  static parseBlockquote(token: Tokens.Blockquote): JSONContent {
    const parser = new MarkdownToTiptapParser();
    return {
      type: "blockquote",
      content: parser.parseTokens(token.tokens || []),
    };
  }

  static parseList(token: Tokens.List): JSONContent {
    const isTaskList = token.items.some((item) => item.task);

    const type = isTaskList
      ? "taskList"
      : token.ordered
        ? "orderedList"
        : "bulletList";
    const items = token.items.map((item) =>
      isTaskList
        ? MarkdownToTiptapParser.parseTaskListItem(item)
        : MarkdownToTiptapParser.parseListItem(item)
    );

    const result: JSONContent = {
      type,
      content: items,
    };

    if (
      !isTaskList &&
      token.ordered &&
      typeof token.start === "number" &&
      token.start !== 1
    ) {
      result.attrs = { start: token.start };
    }

    return result;
  }

  static parseTaskListItem(item: Tokens.ListItem): JSONContent {
    const base = MarkdownToTiptapParser.parseListItem(item);

    return {
      type: "taskItem",
      attrs: { checked: !!item.checked },
      content: base.content,
    };
  }

  static parseListItem(item: Tokens.ListItem): JSONContent {
    const parser = new MarkdownToTiptapParser();
    let content = parser.parseTokens(item.tokens || []);

    // In tight lists, marked doesn't wrap content in paragraphs
    // If the content is empty but we have text, or if content exists without paragraph wrapping
    // Check if we need to wrap in a paragraph
    if (
      content.length > 0 &&
      content.every(
        (node) =>
          node.type !== "paragraph" &&
          node.type !== "codeBlock" &&
          node.type !== "blockquote"
      )
    ) {
      // Content exists but isn't block-level, wrap it in a paragraph
      content = [{ type: "paragraph", content }];
    } else if (content.length === 0 && item.text) {
      // Fallback: parse the text as markdown if tokens are empty
      const textTokens = marked.lexer(item.text);
      content = parser.parseTokens(textTokens);
      if (
        content.length === 0 ||
        content.every((node) => node.type !== "paragraph")
      ) {
        // Still no paragraph, create one from the raw text
        content = [
          { type: "paragraph", content: [{ type: "text", text: item.text }] },
        ];
      }
    }

    return {
      type: "listItem",
      content,
    };
  }

  static parseCodeBlock(token: Tokens.Code): JSONContent {
    return {
      type: "codeBlock",
      attrs: { language: token.lang || null },
      content: [{ type: "text", text: token.text }],
    };
  }

  static parseTable(token: Tokens.Table): JSONContent {
    const rows: JSONContent[] = [];
    const headerRow: JSONContent = {
      type: "tableRow",
      content: token.header.map((cell: Tokens.TableCell) => ({
        type: "tableHeader",
        content: MarkdownToTiptapParser.parseInlineTokens(cell.tokens || []),
      })),
    };
    rows.push(headerRow);

    for (const row of token.rows) {
      rows.push({
        type: "tableRow",
        content: row.map((cell: Tokens.TableCell) => ({
          type: "tableCell",
          content: MarkdownToTiptapParser.parseInlineTokens(cell.tokens || []),
        })),
      });
    }

    return { type: "table", content: rows };
  }

  static parseHTML(token: Tokens.HTML): JSONContent | null {
    const text = token.text;
    const imgMatch = text.match(
      /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/i
    );
    if (imgMatch) {
      return {
        type: "image",
        attrs: { src: imgMatch[1], alt: imgMatch[2] },
      };
    }
    return { type: "paragraph", content: [{ type: "text", text }] };
  }

  static parseInlineTokens(tokens: Token[]): JSONContent[] {
    const content: JSONContent[] = [];
    for (const token of tokens) {
      const nodes = MarkdownToTiptapParser.parseInlineToken(token);
      if (nodes) {
        if (Array.isArray(nodes)) {
          content.push(...nodes);
        } else {
          content.push(nodes);
        }
      }
    }
    return content;
  }

  static parseInlineToken(token: Token): JSONContent | JSONContent[] | null {
    switch (token.type) {
      case "text":
        return { type: "text", text: (token as Tokens.Text).text };
      case "strong":
        return MarkdownToTiptapParser.parseStrong(token as Tokens.Strong);
      case "em":
        return MarkdownToTiptapParser.parseEm(token as Tokens.Em);
      case "codespan":
        return MarkdownToTiptapParser.parseCodespan(token as Tokens.Codespan);
      case "del":
        return MarkdownToTiptapParser.parseDel(token as Tokens.Del);
      case "link":
        return MarkdownToTiptapParser.parseLink(token as Tokens.Link);
      case "image":
        return MarkdownToTiptapParser.parseImage(token as Tokens.Image);
      case "br":
        return { type: "hardBreak" };
      default:
        return null;
    }
  }

  static parseStrong(token: Tokens.Strong): JSONContent[] {
    const content = MarkdownToTiptapParser.parseInlineTokens(
      token.tokens || []
    );
    return content.map((node) => ({
      ...node,
      marks: [...(node.marks || []), { type: "bold" }],
    }));
  }

  static parseEm(token: Tokens.Em): JSONContent[] {
    const content = MarkdownToTiptapParser.parseInlineTokens(
      token.tokens || []
    );
    return content.map((node) => ({
      ...node,
      marks: [...(node.marks || []), { type: "italic" }],
    }));
  }

  static parseCodespan(token: Tokens.Codespan): JSONContent {
    return {
      type: "text",
      text: token.text,
      marks: [{ type: "code" }],
    };
  }

  static parseDel(token: Tokens.Del): JSONContent[] {
    const content = MarkdownToTiptapParser.parseInlineTokens(
      token.tokens || []
    );
    return content.map((node) => ({
      ...node,
      marks: [...(node.marks || []), { type: "strike" }],
    }));
  }

  static parseLink(token: Tokens.Link): JSONContent[] {
    const content = MarkdownToTiptapParser.parseInlineTokens(
      token.tokens || []
    );
    return content.map((node) => ({
      ...node,
      marks: [
        ...(node.marks || []),
        { type: "link", attrs: { href: token.href, title: token.title } },
      ],
    }));
  }

  static parseImage(token: Tokens.Image): JSONContent {
    return {
      type: "image",
      attrs: { src: token.href, alt: token.text, title: token.title },
    };
  }
}

export function markdownToTiptap(markdown: string): JSONContent {
  const parser = new MarkdownToTiptapParser();
  return parser.parse(markdown);
}

export async function markdownToHtml(markdown: string): Promise<string> {
  marked.setOptions({ gfm: true, breaks: true });
  return await marked(markdown);
}
