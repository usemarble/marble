import { describe, expect, it } from "vitest";
import { parseMarkdownImport } from "./import-content";

describe("parseMarkdownImport", () => {
  it("reads standard frontmatter keys", () => {
    const parsed = parseMarkdownImport(
      "notes/docker.md",
      `---
title: Connect a Docker container
date: 2024-01-15
description: Run Tailscale as a sidecar.
category: Coding
tags: [docker, networking]
---

Body text.
`
    );

    expect(parsed).toMatchObject({
      title: "Connect a Docker container",
      slug: "connect-a-docker-container",
      description: "Run Tailscale as a sidecar.",
      publishedAt: new Date("2024-01-15T12:00:00.000Z"),
      rawCategory: "Coding",
      rawTags: ["docker", "networking"],
    });
  });

  it.each(["excerpt", "summary"])("reads the description from %s", (key) => {
    const parsed = parseMarkdownImport(
      "post.md",
      `---\n${key}: From frontmatter\n---\n\nBody text.`
    );

    expect(parsed.description).toBe("From frontmatter");
  });

  it("builds a description from the opening prose when there isn't one", () => {
    const parsed = parseMarkdownImport(
      "post.md",
      `# Hello world

## Setup

\`\`\`sh
docker run tailscale
\`\`\`

Install **Docker** first, then [Tailscale](https://tailscale.com).

- Step one
- Step two
`
    );

    expect(parsed.title).toBe("Hello world");
    expect(parsed.description).toBe(
      "Install Docker first, then Tailscale. Step one Step two"
    );
  });

  it("cuts long descriptions at a word boundary", () => {
    const sentence = "Marble imports Markdown notes with their frontmatter. ";
    const parsed = parseMarkdownImport("post.md", sentence.repeat(10));

    expect(parsed.description.length).toBeLessThanOrEqual(161);
    expect(parsed.description).toMatch(/ [A-Za-z]+…$/);
    expect(sentence.repeat(10)).toContain(parsed.description.slice(0, -1));
  });

  it("strips block HTML and MDX tags from the description", () => {
    const parsed = parseMarkdownImport(
      "post.mdx",
      `import { Callout } from "./callout";

<Callout type="info">
Read this first.
</Callout>
`
    );

    expect(parsed.description).toBe("Read this first.");
  });

  it("falls back to the filename and title for content-only files", () => {
    const parsed = parseMarkdownImport("notes/my-first_note.md", "");

    expect(parsed).toMatchObject({
      title: "my first note",
      slug: "my-first-note",
      description: "my first note",
      publishedAt: undefined,
      rawCategory: undefined,
      rawTags: undefined,
    });
  });

  it("keeps an explicit time and reads date aliases", () => {
    const withTime = parseMarkdownImport(
      "post.md",
      "---\ndate: 2024-01-15T09:30:00Z\n---\nBody"
    );
    const quoted = parseMarkdownImport(
      "post.md",
      '---\npubDate: "2024-03-02"\n---\nBody'
    );
    const camelCase = parseMarkdownImport(
      "post.md",
      '---\npublishedAt: "2024-03-02T08:00:00+02:00"\n---\nBody'
    );
    const midnight = parseMarkdownImport(
      "post.md",
      '---\ndate: "2024-01-15T00:00:00Z"\n---\nBody'
    );

    expect(withTime.publishedAt).toEqual(new Date("2024-01-15T09:30:00Z"));
    expect(quoted.publishedAt).toEqual(new Date("2024-03-02T12:00:00Z"));
    expect(camelCase.publishedAt).toEqual(new Date("2024-03-02T06:00:00Z"));
    expect(midnight.publishedAt).toEqual(new Date("2024-01-15T00:00:00Z"));
  });

  it.each([
    ["an invalid string", 'date: "someday"'],
    ["a number", "date: 2024"],
    ["a boolean", "date: true"],
  ])("ignores a date that is %s", (_label, line) => {
    const parsed = parseMarkdownImport("post.md", `---\n${line}\n---\nBody`);

    expect(parsed.publishedAt).toBeUndefined();
  });

  it.each([
    ["a list in category", "category: [Coding, Web]", "Coding"],
    ["the first of categories", "categories: [Coding, Web]", "Coding"],
    ["comma-separated categories", "categories: Coding, Web", "Coding"],
    ["a blank category", 'category: ""', undefined],
  ])("reads %s", (_label, line, expected) => {
    const parsed = parseMarkdownImport("post.md", `---\n${line}\n---\nBody`);

    expect(parsed.rawCategory).toBe(expected);
  });

  it.each([
    [
      "comma-separated tags",
      "tags: docker, networking",
      ["docker", "networking"],
    ],
    [
      "hash-prefixed tags",
      'tags: ["#docker", "networking"]',
      ["docker", "networking"],
    ],
    ["non-string tags", "tags: [docker, 2024, null]", ["docker"]],
    ["empty tags", "tags: []", undefined],
  ])("reads %s", (_label, line, expected) => {
    const parsed = parseMarkdownImport("post.md", `---\n${line}\n---\nBody`);

    expect(parsed.rawTags).toEqual(expected);
  });
});
