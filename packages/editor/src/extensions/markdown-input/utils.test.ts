import { getSchema } from "@tiptap/core";
import { MarkdownManager } from "@tiptap/markdown";
import type { Node } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { ExtensionKit } from "../extension-kit";
import { parseMarkdown, stripFrontmatter } from "./utils";

const extensions = ExtensionKit();
const editor = {
  markdown: new MarkdownManager({ extensions }),
  schema: getSchema(extensions),
};

/** Parses like a paste does and checks the result against the schema. */
function parse(markdown: string) {
  const doc = editor.schema.nodeFromJSON(parseMarkdown(editor, markdown));
  doc.check();
  return doc;
}

function findAll(doc: Node, predicate: (node: Node) => boolean) {
  const found: Node[] = [];
  doc.descendants((node) => {
    if (predicate(node)) {
      found.push(node);
    }
  });
  return found;
}

function findText(doc: Node, text: string) {
  const [node] = findAll(doc, (n) => n.isText && n.text === text);
  if (!node) {
    throw new Error(`No text node "${text}"`);
  }
  return node;
}

function markNames(node: Node) {
  return node.marks.map((mark) => mark.type.name);
}

// Shaped like the docs pages "Copy markdown" buttons produce.
const DOCS_PAGE = `## Run it

1. Create \`compose.yaml\`:

   \`\`\`yaml
   services:
     app:
       image: nginx:latest
   \`\`\`

   > **Note:**
   >
   > Indent with spaces.

2. Start it.

**Components**

* \`app\`: Runs the server.
  * \`image\`: Which image to pull.
    * \`ports\`: Maps [port mappings][docs-ports].

See [\`compose-examples\`][examples] for more.

[docs-ports]: https://docs.docker.com/compose/ports
[examples]: https://github.com/example/compose-examples
`;

describe("parseMarkdown", () => {
  it("parses a docs page into content the editor accepts", () => {
    const doc = parse(DOCS_PAGE);

    expect(doc.firstChild?.type.name).toBe("heading");
    expect(doc.firstChild?.attrs.level).toBe(2);
    expect(findAll(doc, (n) => n.type.name === "bulletList")).toHaveLength(3);
    expect(findText(doc, "port mappings").marks[0]?.attrs.href).toBe(
      "https://docs.docker.com/compose/ports"
    );
  });

  it("keeps the indentation of code blocks in numbered steps", () => {
    const [codeBlock] = findAll(
      parse(DOCS_PAGE),
      (n) => n.type.name === "codeBlock"
    );

    expect(codeBlock?.attrs.language).toBe("yaml");
    expect(codeBlock?.textContent).toBe(
      "services:\n  app:\n    image: nginx:latest"
    );
  });

  it("keeps the link when inline code is linked", () => {
    const text = findText(parse(DOCS_PAGE), "compose-examples");

    expect(markNames(text)).toEqual(["link"]);
    expect(text.marks[0]?.attrs.href).toBe(
      "https://github.com/example/compose-examples"
    );
  });

  it("keeps inline code over other marks", () => {
    const doc = parse("Run it with **`--force`** or *`-f`*.");

    expect(markNames(findText(doc, "--force"))).toEqual(["code"]);
    expect(markNames(findText(doc, "-f"))).toEqual(["code"]);
  });

  it("leaves out frontmatter", () => {
    const doc = parse("---\ntitle: Hello\ndate: 2026-10-07\n---\n\n# Hello\n");

    expect(doc.childCount).toBe(1);
    expect(doc.firstChild?.textContent).toBe("Hello");
  });
});

describe("stripFrontmatter", () => {
  it("removes a leading frontmatter block", () => {
    expect(stripFrontmatter("---\ntitle: Hi\n---\nBody")).toBe("Body");
  });

  it("leaves a divider that isn't frontmatter", () => {
    const markdown = "---\nJust a divider\n---\n";
    expect(stripFrontmatter(markdown)).toBe(markdown);
  });
});
