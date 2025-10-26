import type { Tokens } from "marked";
import { describe, expect, it } from "vitest";
import { MarkdownToTiptapParser, markdownToTiptap } from "../src/tiptap";

describe("MarkdownToTiptapParser static inline parsers", () => {
  it("parseStrong adds bold mark to inner content", () => {
    const token: Tokens.Strong = {
      type: "strong",
      raw: "**bold**",
      text: "bold",
      tokens: [{ type: "text", raw: "bold", text: "bold" }],
    };

    const result = MarkdownToTiptapParser.parseStrong(token);
    expect(result).toEqual([
      { type: "text", text: "bold", marks: [{ type: "bold" }] },
    ]);
  });

  it("parseEm adds italic mark to inner content", () => {
    const token: Tokens.Em = {
      type: "em",
      raw: "*italic*",
      text: "italic",
      tokens: [{ type: "text", raw: "italic", text: "italic" }],
    };

    const result = MarkdownToTiptapParser.parseEm(token);
    expect(result).toEqual([
      { type: "text", text: "italic", marks: [{ type: "italic" }] },
    ]);
  });

  it("parseDel adds strike mark to inner content", () => {
    const token: Tokens.Del = {
      type: "del",
      raw: "~~strike~~",
      text: "strike",
      tokens: [{ type: "text", raw: "strike", text: "strike" }],
    };

    const result = MarkdownToTiptapParser.parseDel(token);
    expect(result).toEqual([
      { type: "text", text: "strike", marks: [{ type: "strike" }] },
    ]);
  });

  it("parseCodespan adds code mark to text", () => {
    const token: Tokens.Codespan = {
      type: "codespan",
      raw: "`code`",
      text: "code",
    };

    const result = MarkdownToTiptapParser.parseCodespan(token);
    expect(result).toEqual({
      type: "text",
      text: "code",
      marks: [{ type: "code" }],
    });
  });

  it("parseLink adds link mark with href and title to inner content", () => {
    const token: Tokens.Link = {
      type: "link",
      raw: "[click](https://example.com)",
      href: "https://example.com",
      title: null,
      text: "click",
      tokens: [{ type: "text", raw: "click", text: "click" }],
    };

    const result = MarkdownToTiptapParser.parseLink(token);
    expect(result).toEqual([
      {
        type: "text",
        text: "click",
        marks: [
          { type: "link", attrs: { href: "https://example.com", title: null } },
        ],
      },
    ]);
  });

  it("parseImage returns image node with attrs", () => {
    const token: Tokens.Image = {
      type: "image",
      raw: "![alt](https://img)",
      href: "https://img",
      title: "title",
      text: "alt",
      tokens: [{ type: "text", raw: "alt", text: "alt" }],
    };

    const result = MarkdownToTiptapParser.parseImage(token);
    expect(result).toEqual({
      type: "image",
      attrs: { src: "https://img", alt: "alt", title: "title" },
    });
  });
});

describe("MarkdownToTiptapParser static block-level parsers", () => {
  it("parseHeading returns heading node with level and content", () => {
    const token: Tokens.Heading = {
      type: "heading",
      raw: "## Hello",
      depth: 2,
      text: "Hello",
      tokens: [{ type: "text", raw: "Hello", text: "Hello" }],
    };

    const result = MarkdownToTiptapParser.parseHeading(token);
    expect(result).toEqual({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Hello" }],
    });
  });

  it("parseParagraph returns paragraph node with inline content", () => {
    const token: Tokens.Paragraph = {
      type: "paragraph",
      raw: "Hello world",
      text: "Hello world",
      tokens: [
        { type: "text", raw: "Hello", text: "Hello" },
        { type: "text", raw: " world", text: " world" },
      ],
    } as unknown as Tokens.Paragraph;

    const result = MarkdownToTiptapParser.parseParagraph(token);
    expect(result).toEqual({
      type: "paragraph",
      content: [
        { type: "text", text: "Hello" },
        { type: "text", text: " world" },
      ],
    });
  });

  it("parseBlockquote returns blockquote wrapping parsed tokens", () => {
    const token: Tokens.Blockquote = {
      type: "blockquote",
      raw: "> quote",
      text: "quote",
      tokens: [
        {
          type: "paragraph",
          raw: "quote",
          text: "quote",
          tokens: [{ type: "text", raw: "quote", text: "quote" }],
        } as unknown as Tokens.Paragraph,
      ],
    };

    const result = MarkdownToTiptapParser.parseBlockquote(token);
    expect(result).toEqual({
      type: "blockquote",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "quote" }] },
      ],
    });
  });

  it("parseList returns bulletList with listItem content for unordered lists", () => {
    const token: Tokens.List = {
      type: "list",
      raw: "- a\n- b",
      ordered: false,
      start: "",
      loose: false,
      items: [
        {
          type: "list_item",
          raw: "- a",
          task: false,
          checked: undefined,
          loose: false,
          text: "a",
          tokens: [
            {
              type: "paragraph",
              raw: "a",
              text: "a",
              tokens: [{ type: "text", raw: "a", text: "a" }],
            } as unknown as Tokens.Paragraph,
          ],
        },
        {
          type: "list_item",
          raw: "- b",
          task: false,
          checked: undefined,
          loose: false,
          text: "b",
          tokens: [
            {
              type: "paragraph",
              raw: "b",
              text: "b",
              tokens: [{ type: "text", raw: "b", text: "b" }],
            } as unknown as Tokens.Paragraph,
          ],
        },
      ],
    };

    const result = MarkdownToTiptapParser.parseList(token);
    expect(result).toEqual({
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "a" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "b" }] },
          ],
        },
      ],
    });
  });

  it("parseList returns orderedList and preserves start when not 1", () => {
    const token: Tokens.List = {
      type: "list",
      raw: "2. a\n3. b",
      ordered: true,
      start: 2,
      loose: false,
      items: [
        {
          type: "list_item",
          raw: "2. a",
          task: false,
          checked: undefined,
          loose: false,
          text: "a",
          tokens: [
            {
              type: "paragraph",
              raw: "a",
              text: "a",
              tokens: [{ type: "text", raw: "a", text: "a" }],
            } as unknown as Tokens.Paragraph,
          ],
        },
      ],
    };

    const result = MarkdownToTiptapParser.parseList(token);
    expect(result).toEqual({
      type: "orderedList",
      attrs: { start: 2 },
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "a" }] },
          ],
        },
      ],
    });
  });

  it("parseList returns orderedList without attrs when starting at 1", () => {
    const token: Tokens.List = {
      type: "list",
      raw: "1. first\n2. second",
      ordered: true,
      start: 1,
      loose: false,
      items: [
        {
          type: "list_item",
          raw: "1. first",
          task: false,
          checked: undefined,
          loose: false,
          text: "first",
          tokens: [
            {
              type: "paragraph",
              raw: "first",
              text: "first",
              tokens: [{ type: "text", raw: "first", text: "first" }],
            } as unknown as Tokens.Paragraph,
          ],
        },
        {
          type: "list_item",
          raw: "2. second",
          task: false,
          checked: undefined,
          loose: false,
          text: "second",
          tokens: [
            {
              type: "paragraph",
              raw: "second",
              text: "second",
              tokens: [{ type: "text", raw: "second", text: "second" }],
            } as unknown as Tokens.Paragraph,
          ],
        },
      ],
    };

    const result = MarkdownToTiptapParser.parseList(token);
    expect(result).toEqual({
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "first" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "second" }] },
          ],
        },
      ],
    });
  });

  it("parseListItem returns listItem for non-task items", () => {
    const item: Tokens.ListItem = {
      type: "list_item",
      raw: "- normal",
      task: false,
      checked: undefined,
      loose: false,
      text: "normal",
      tokens: [
        {
          type: "paragraph",
          raw: "normal",
          text: "normal",
          tokens: [{ type: "text", raw: "normal", text: "normal" }],
        } as unknown as Tokens.Paragraph,
      ],
    };

    const result = MarkdownToTiptapParser.parseListItem(item);
    expect(result).toEqual({
      type: "listItem",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "normal" }] },
      ],
    });
  });

  it("parseCodeBlock returns codeBlock with language and text content", () => {
    const token: Tokens.Code = {
      type: "code",
      raw: "```js\nconsole.log('x')\n```",
      lang: "js",
      text: "console.log('x')",
    };

    const result = MarkdownToTiptapParser.parseCodeBlock(token);
    expect(result).toEqual({
      type: "codeBlock",
      attrs: { language: "js" },
      content: [{ type: "text", text: "console.log('x')" }],
    });
  });

  it("parseTable returns table with header and rows", () => {
    const token: Tokens.Table = {
      type: "table",
      raw: "| H1 | H2 |\n| --- | --- |\n| A | B |",
      align: [],
      header: [
        {
          type: "tablecell",
          raw: "H1",
          text: "H1",
          tokens: [{ type: "text", raw: "H1", text: "H1" }],
        } as unknown as Tokens.TableCell,
        {
          type: "tablecell",
          raw: "H2",
          text: "H2",
          tokens: [{ type: "text", raw: "H2", text: "H2" }],
        } as unknown as Tokens.TableCell,
      ],
      rows: [
        [
          {
            type: "tablecell",
            raw: "A",
            text: "A",
            tokens: [{ type: "text", raw: "A", text: "A" }],
          } as unknown as Tokens.TableCell,
          {
            type: "tablecell",
            raw: "B",
            text: "B",
            tokens: [{ type: "text", raw: "B", text: "B" }],
          } as unknown as Tokens.TableCell,
        ],
      ],
    };

    const result = MarkdownToTiptapParser.parseTable(token);
    expect(result).toEqual({
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "text", text: "H1" }] },
            { type: "tableHeader", content: [{ type: "text", text: "H2" }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "text", text: "A" }] },
            { type: "tableCell", content: [{ type: "text", text: "B" }] },
          ],
        },
      ],
    });
  });

  it("parseHTML returns image node for <img> tag with src and alt", () => {
    const token: Tokens.HTML = {
      type: "html",
      raw: '<img src="https://img" alt="Alt"/>',
      pre: false,
      text: '<img src="https://img" alt="Alt"/>',
      block: false,
    };

    const result = MarkdownToTiptapParser.parseHTML(token);
    expect(result).toEqual({
      type: "image",
      attrs: { src: "https://img", alt: "Alt" },
    });
  });

  it("parseHTML falls back to paragraph with raw HTML text when not img", () => {
    const token: Tokens.HTML = {
      type: "html",
      raw: "<div>content</div>",
      pre: false,
      text: "<div>content</div>",
      block: false,
    };

    const result = MarkdownToTiptapParser.parseHTML(token);
    expect(result).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "<div>content</div>" }],
    });
  });
});

describe("MarkdownToTiptapParser inline helpers", () => {
  it("parseInlineToken maps text to text node", () => {
    const token: Tokens.Text = { type: "text", raw: "a", text: "a" };
    const result = MarkdownToTiptapParser.parseInlineToken(token);
    expect(result).toEqual({ type: "text", text: "a" });
  });

  it("parseInlineToken maps br to hardBreak", () => {
    const token: Tokens.Br = { type: "br", raw: "  \n" } as Tokens.Br;
    const result = MarkdownToTiptapParser.parseInlineToken(token);
    expect(result).toEqual({ type: "hardBreak" });
  });

  it("parseInlineToken returns null for unhandled token types", () => {
    const token = { type: "unknown", raw: "?" } as unknown as Tokens.Generic;
    const result = MarkdownToTiptapParser.parseInlineToken(token as never);
    expect(result).toBeNull();
  });

  it("parseInlineTokens flattens arrays from strong/em/del and preserves order", () => {
    const tokens: Tokens.Generic[] = [
      { type: "text", raw: "a", text: "a" } as Tokens.Text,
      {
        type: "strong",
        raw: "**b**",
        text: "b",
        tokens: [{ type: "text", raw: "b", text: "b" }],
      } as unknown as Tokens.Strong,
      { type: "br", raw: "  \n" } as unknown as Tokens.Br,
    ];

    const result = MarkdownToTiptapParser.parseInlineTokens(
      tokens as unknown as Tokens.Generic[]
    );
    expect(result).toEqual([
      { type: "text", text: "a" },
      { type: "text", text: "b", marks: [{ type: "bold" }] },
      { type: "hardBreak" },
    ]);
  });
});

describe("MarkdownToTiptapParser integration tests", () => {
  it("parses bullet list correctly from markdown", () => {
    const markdown = "- First item\n- Second item\n- Third item";
    const result = markdownToTiptap(markdown);

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Third item" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("parses ordered list starting at 1 correctly from markdown", () => {
    const markdown = "1. First item\n2. Second item\n3. Third item";
    const result = markdownToTiptap(markdown);

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Third item" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("parses ordered list starting at custom number correctly from markdown", () => {
    const markdown = "5. Fifth item\n6. Sixth item\n7. Seventh item";
    const result = markdownToTiptap(markdown);

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { start: 5 },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Fifth item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Sixth item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Seventh item" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("parses mixed content with lists correctly from markdown", () => {
    const markdown =
      "# Title\n\nSome text.\n\n- Bullet 1\n- Bullet 2\n\n1. Ordered 1\n2. Ordered 2";
    const result = markdownToTiptap(markdown);

    expect(result.type).toEqual("doc");
    expect(result.content).toHaveLength(4);
    expect(result.content?.[0]?.type).toEqual("heading");
    expect(result.content?.[1]?.type).toEqual("paragraph");
    expect(result.content?.[2]?.type).toEqual("bulletList");
    expect(result.content?.[3]?.type).toEqual("orderedList");
  });

  it("parses task list with checked and unchecked items", () => {
    const markdown = "- [x] Done\n- [ ] Not done";
    const result = markdownToTiptap(markdown);
    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Done" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Not done" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
