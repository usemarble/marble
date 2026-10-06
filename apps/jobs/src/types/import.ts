import type { markdownToTiptap } from "@marble/parser/markdown";

/** Markdown or MDX content discovered from a single file or zip entry. */
export interface ImportMarkdownFile {
  sourceRef: string;
  content: string;
}

/** Normalized post fields parsed from Markdown content and frontmatter. */
export interface ParsedMarkdownImport {
  sourceRef: string;
  title: string;
  slug: string;
  content: string;
  contentJson: ReturnType<typeof markdownToTiptap>;
  description: string;
  publishedAt?: Date;
  rawCategory?: string;
  rawTags?: string[];
  rawAuthor?: string;
}
