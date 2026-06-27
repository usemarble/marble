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
  description: string;
  rawCategory?: string;
  rawTags?: string | string[];
  rawAuthor?: string;
}
