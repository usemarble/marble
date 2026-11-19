import { describe, expect, it } from "vitest";
import {
  htmlToMarkdown,
  htmlToTiptap,
  markdownToTiptap,
  normalizePostContent,
} from "../src";

describe("htmlToTiptap", () => {
  it("keeps every fallback audio source through normalization and Markdown import", async () => {
    const html =
      '<figure><audio controls><source src="https://cdn.example.com/song.ogg" type="audio/ogg"><source src="https://cdn.example.com/song.mp3" type="audio/mpeg"></audio><figcaption>A song</figcaption></figure>';
    const sources = [
      { src: "https://cdn.example.com/song.ogg", type: "audio/ogg" },
      { src: "https://cdn.example.com/song.mp3", type: "audio/mpeg" },
    ];
    expect(htmlToTiptap(html).content?.[0]?.attrs?.sources).toEqual(sources);
    const markdown = `# Song\n\n${htmlToMarkdown(html)}`;
    expect(
      (await normalizePostContent(markdown)).contentJson.content?.[1]?.attrs
        ?.sources
    ).toEqual(sources);
    expect(markdownToTiptap(markdown).content?.[1]).toMatchObject({
      type: "audio",
      attrs: { src: null, sources, caption: "A song" },
    });
  });

  it("preserves the source and caption of an audio figure", async () => {
    const html =
      '<figure data-type="audio"><audio src="https://cdn.example.com/song.mp3" controls preload="metadata"></audio><figcaption>Live &amp; acoustic</figcaption></figure>';
    const result = htmlToTiptap(html);
    expect(result.content).toEqual([
      expect.objectContaining({
        type: "audio",
        attrs: expect.objectContaining({
          src: "https://cdn.example.com/song.mp3",
          caption: "Live & acoustic",
          controls: true,
          preload: "metadata",
        }),
      }),
    ]);
    const markdown = htmlToMarkdown(html);
    expect(
      (await normalizePostContent(`# Audio\n\n${markdown}`)).contentJson.content
    ).toContainEqual(result.content?.[0]);
  });

  it("preserves native audio through HTML, Markdown, and normalized content", async () => {
    const html =
      '<audio src="https://cdn.example.com/song.mp3" controls="" preload="metadata"></audio>';
    const result = htmlToTiptap(html);
    expect(result.content).toEqual([
      expect.objectContaining({
        type: "audio",
        attrs: expect.objectContaining({
          src: "https://cdn.example.com/song.mp3",
          preload: "metadata",
        }),
      }),
    ]);
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain("<audio");
    expect(markdownToTiptap(markdown).content?.[0]).toMatchObject({
      type: "audio",
      attrs: { src: "https://cdn.example.com/song.mp3", preload: "metadata" },
    });
    expect(
      (await normalizePostContent(`# Audio\n\n${markdown}`)).contentJson.content
    ).toContainEqual(result.content?.[0]);
  });
  it("converts HTML into Tiptap JSON", () => {
    const result = htmlToTiptap("<h2>Hello</h2><p>World</p>");

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "World" }],
        },
      ],
    });
  });

  it("parses Marble media figures", () => {
    const result = htmlToTiptap(
      '<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Alt text"><figcaption>Caption</figcaption></figure>'
    );

    expect(result.content?.[0]).toEqual({
      type: "figure",
      attrs: {
        src: "https://example.com/image.png",
        alt: "Alt text",
        caption: null,
        href: null,
        width: "75",
        align: "left",
      },
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "Caption" }],
        },
      ],
    });
  });

  it("preserves links inside figure captions", () => {
    const result = htmlToTiptap(
      '<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Alt text"><figcaption>Image by <a href="https://example.com/source">Source</a></figcaption></figure>'
    );

    expect(result.content?.[0]).toEqual({
      type: "figure",
      attrs: {
        src: "https://example.com/image.png",
        alt: "Alt text",
        caption: null,
        href: null,
        width: "75",
        align: "left",
      },
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [
            { type: "text", text: "Image by " },
            {
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: {
                    class: "",
                    href: "https://example.com/source",
                    rel: "noopener noreferrer nofollow",
                    target: "_blank",
                    title: null,
                  },
                },
              ],
              text: "Source",
            },
          ],
        },
      ],
    });
  });

  it("keeps image links separate from caption links", () => {
    const result = htmlToTiptap(
      '<figure><a href="https://example.com/full"><img src="https://example.com/image.png" alt="Alt text"></a><figcaption>Image by <a href="https://example.com/source">Source</a></figcaption></figure>'
    );

    expect(result.content?.[0]).toMatchObject({
      type: "figure",
      attrs: {
        href: "https://example.com/full",
      },
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Image by " },
            {
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://example.com/source" },
                },
              ],
              text: "Source",
            },
          ],
        },
      ],
    });
  });

  it("returns an empty doc for empty HTML", () => {
    expect(htmlToTiptap("   ")).toEqual({ type: "doc", content: [] });
  });
});

describe("htmlToMarkdown", () => {
  it("preserves Marble media figures as raw HTML", () => {
    const html =
      '<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Alt text"><figcaption>Caption</figcaption></figure>';

    expect(htmlToMarkdown(html)).toBe(
      '<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Alt text"><figcaption>Caption</figcaption></figure>'
    );
  });

  it("preserves embeds as raw HTML and converts task lists", () => {
    const html =
      '<div data-youtube-video><iframe src="https://www.youtube.com/embed/video"></iframe></div><div data-twitter data-src="https://x.com/usemarble/status/1"></div><ul><li><input type="checkbox" checked="checked">Done</li><li><input type="checkbox">Todo</li></ul>';

    expect(htmlToMarkdown(html)).toBe(
      '<div data-youtube-video=""><iframe src="https://www.youtube.com/embed/video"></iframe></div>\n\n<div data-twitter="" data-src="https://x.com/usemarble/status/1"></div>\n\n- [x] Done\n- [ ] Todo'
    );
  });

  it("does not emit indentation from formatted HTML text nodes", () => {
    const html = `<h1>Title</h1>
<p>Body</p>
<ul>
<li>One</li>
<li>Two</li>
</ul>
<pre><code class="language-ts">const value = 42;
</code></pre>`;

    expect(htmlToMarkdown(html)).toBe(
      "# Title\n\nBody\n\n- One\n- Two\n\n```ts\nconst value = 42;\n```"
    );
  });

  it("preserves nested list structure", () => {
    const html =
      "<ul><li>Parent<ul><li>Child</li></ul></li><li>Sibling</li></ul>";

    expect(htmlToMarkdown(html)).toBe("- Parent\n  - Child\n- Sibling");
  });
});

describe("normalizePostContent", () => {
  it("detects obvious markdown and converts it to HTML", async () => {
    const result = await normalizePostContent("# Title\n\nSome **bold** text");

    expect(result.detectedFormat).toBe("markdown");
    expect(result.html.trim()).toBe(
      "<h1>Title</h1>\n<p>Some <strong>bold</strong> text</p>"
    );
    expect(result.contentJson.content?.[0]?.type).toBe("heading");
  });

  it("detects single-list markdown writes", async () => {
    const result = await normalizePostContent("- item");

    expect(result.detectedFormat).toBe("markdown");
    expect(result.html.trim()).toBe("<ul>\n<li>item</li>\n</ul>");
    expect(result.contentJson.content?.[0]?.type).toBe("bulletList");
  });

  it("treats HTML with markdown-looking text as HTML", async () => {
    const result = await normalizePostContent("<p># Not a heading</p>");

    expect(result.detectedFormat).toBe("html");
    expect(result.html).toBe("<p># Not a heading</p>");
    expect(result.contentJson.content?.[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "# Not a heading" }],
    });
  });

  it("preserves HTML posts with Markdown syntax in links and code blocks", async () => {
    const html =
      '<p><a target="_blank" href="https://example.com">Guide</a></p>' +
      '<pre><code class="language-tsx">const props = { __html: post.content };\n' +
      'const path = "/media/**";</code></pre>';

    const result = await normalizePostContent(html);

    expect(result.detectedFormat).toBe("html");
    expect(result.html).toBe(html);
    expect(result.contentJson.content?.[1]).toMatchObject({
      type: "codeBlock",
      attrs: { language: "tsx" },
      content: [
        {
          type: "text",
          text: 'const props = { __html: post.content };\nconst path = "/media/**";',
        },
      ],
    });
  });

  it("preserves raw editor HTML embedded inside markdown", async () => {
    const result = await normalizePostContent(
      '# Title\n\n<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Alt text"><figcaption>Caption</figcaption></figure>'
    );

    expect(result.detectedFormat).toBe("markdown");
    expect(result.html).toContain("<figure");
    expect(result.contentJson.content?.[1]).toMatchObject({
      type: "figure",
      attrs: {
        src: "https://example.com/image.png",
        alt: "Alt text",
        caption: null,
        width: "75",
        align: "left",
      },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Caption" }],
        },
      ],
    });
  });

  it("detects markdown after a leading raw HTML figure", async () => {
    const content =
      '<figure data-width="75" data-align="left"><img src="https://example.com/image.png" alt="Example"><figcaption>Caption</figcaption></figure>\n\n# Title';

    const result = await normalizePostContent(content);

    expect(result.detectedFormat).toBe("markdown");
    expect(result.html).toContain("<h1>Title</h1>");
  });
});

describe("markdownToTiptap", () => {
  it("preserves inline marks and hard breaks in order", () => {
    const result = markdownToTiptap(
      'Text **bold** *italic* ~~removed~~ `code`  \n[Guide](https://example.com "Title")'
    );

    expect(result.content).toEqual([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Text " },
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: " " },
          { type: "text", text: "italic", marks: [{ type: "italic" }] },
          { type: "text", text: " " },
          { type: "text", text: "removed", marks: [{ type: "strike" }] },
          { type: "text", text: " " },
          { type: "text", text: "code", marks: [{ type: "code" }] },
          { type: "hardBreak" },
          {
            type: "text",
            text: "Guide",
            marks: [
              {
                type: "link",
                attrs: { href: "https://example.com", title: "Title" },
              },
            ],
          },
        ],
      },
    ]);
  });

  it.each([
    [
      '![Alt](https://example.com/image.png "Title")',
      {
        type: "paragraph",
        content: [
          {
            type: "image",
            attrs: {
              src: "https://example.com/image.png",
              alt: "Alt",
              title: "Title",
            },
          },
        ],
      },
    ],
    [
      '<img src="https://example.com/image.png" alt="Alt"/>',
      {
        type: "image",
        attrs: { src: "https://example.com/image.png", alt: "Alt" },
      },
    ],
  ])("preserves the source and alt text of %s", (markdown, expected) => {
    expect(markdownToTiptap(markdown).content).toEqual([expected]);
  });

  it("preserves quote text, code language and code indentation", () => {
    const markdown = "> A quote\n\n```js\n  work();\n```";
    expect(markdownToTiptap(markdown).content).toEqual([
      {
        type: "blockquote",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "A quote" }] },
        ],
      },
      {
        type: "codeBlock",
        attrs: { language: "js" },
        content: [{ type: "text", text: "  work();" }],
      },
    ]);
  });

  it("preserves unsupported block HTML as text during Markdown import", () => {
    expect(markdownToTiptap("<div>content</div>").content).toEqual([
      {
        type: "paragraph",
        content: [{ type: "text", text: "<div>content</div>" }],
      },
    ]);
  });

  it.each([
    { markdown: "- First\n- Second", type: "bulletList" },
    { markdown: "1. First\n2. Second", type: "orderedList", start: 1 },
    { markdown: "5. First\n6. Second", type: "orderedList", start: 5 },
  ])(
    "preserves the items and numbering in $markdown",
    ({ markdown, type, start }) => {
      const result = markdownToTiptap(markdown);
      expect(result.content).toMatchObject([
        {
          type,
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second" }],
                },
              ],
            },
          ],
        },
      ]);
      if (start !== undefined) {
        expect(result.content?.[0]?.attrs?.start ?? 1).toBe(start);
      }
    }
  );

  it("parses mixed content with lists correctly from markdown", () => {
    const markdown =
      "## Title\n\nSome text.\n\n- Bullet 1\n- Bullet 2\n\n1. Ordered 1\n2. Ordered 2";
    const result = markdownToTiptap(markdown);

    expect(result.type).toEqual("doc");
    expect(result.content).toHaveLength(4);
    expect(result.content?.slice(0, 2)).toMatchObject([
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Title" }],
      },
      { type: "paragraph", content: [{ type: "text", text: "Some text." }] },
    ]);
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

  it("preserves table headers, cell order, and column alignment", () => {
    const markdown = `| A | B | C | D |
| --- | :--- | :---: | ---: |
| One | Two | Three | Four |
| Five | Six | Seven | Eight |`;
    const result = markdownToTiptap(markdown);
    expect(result.content?.map((node) => node.type)).toEqual(["table"]);
    const rows = result.content?.[0]?.content;
    expect(rows?.map((row) => row.type)).toEqual([
      "tableRow",
      "tableRow",
      "tableRow",
    ]);
    expect(
      rows?.map((row) =>
        row.content?.map((cell) => {
          const paragraph = cell.content?.[0];
          return [
            cell.type,
            paragraph?.attrs?.textAlign ?? null,
            paragraph?.content?.[0]?.text,
          ];
        })
      )
    ).toEqual([
      [
        ["tableHeader", null, "A"],
        ["tableHeader", "left", "B"],
        ["tableHeader", "center", "C"],
        ["tableHeader", "right", "D"],
      ],
      [
        ["tableCell", null, "One"],
        ["tableCell", "left", "Two"],
        ["tableCell", "center", "Three"],
        ["tableCell", "right", "Four"],
      ],
      [
        ["tableCell", null, "Five"],
        ["tableCell", "left", "Six"],
        ["tableCell", "center", "Seven"],
        ["tableCell", "right", "Eight"],
      ],
    ]);
  });
});
