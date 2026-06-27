import { strFromU8, unzipSync } from "fflate";
import matter from "gray-matter";
import type { ImportMarkdownFile, ParsedMarkdownImport } from "@/types/import";

const MAX_ZIP_MARKDOWN_FILES = 100;
const MAX_ZIP_EXTRACTED_BYTES = 20 * 1024 * 1024;

/** Returns true when a zip entry should be treated as importable Markdown. */
function isMarkdownImportFile(filename: string) {
  return /\.(md|mdx)$/i.test(filename);
}

/** Skips directories, macOS archive noise, and hidden path segments. */
function isIgnoredZipEntry(filename: string) {
  const normalized = filename.replaceAll("\\", "/");
  const parts = normalized.split("/");

  return (
    normalized.endsWith("/") ||
    parts.includes("__MACOSX") ||
    parts.some((part) => part.startsWith("."))
  );
}

/** Converts a title or filename into Marble's normalized post slug shape. */
export function generateSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Derives a readable fallback title from an import filename. */
function filenameTitle(filename: string) {
  const basename = filename.split("/").pop() || filename;
  return basename
    .replace(/\.(md|mdx)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

/** Removes common Markdown and HTML markup from a heading candidate. */
function cleanHeadingTitle(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Finds the first top-level Markdown heading outside fenced code blocks. */
function titleFromMarkdownHeading(markdown: string) {
  let inFence = false;
  let offset = 0;

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      offset += line.length + 1;
      continue;
    }

    if (!inFence) {
      const match = /^\s{0,3}#(?!#)\s+(.+?)\s*#*\s*$/.exec(line);

      if (match?.[1]) {
        const title = cleanHeadingTitle(match[1]);

        if (title) {
          return { index: offset, title };
        }
      }
    }

    offset += line.length + 1;
  }

  return null;
}

/** Finds the first HTML h1 in Markdown content as a fallback title source. */
function titleFromHtmlHeading(markdown: string) {
  const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(markdown);
  const title = match?.[1] ? cleanHeadingTitle(match[1]) : "";

  if (!(match && title)) {
    return null;
  }

  return { index: match.index, title };
}

/** Chooses the earliest first-level heading from Markdown or inline HTML. */
function contentTitle(markdown: string) {
  const markdownHeading = titleFromMarkdownHeading(markdown);
  const htmlHeading = titleFromHtmlHeading(markdown);

  if (!(markdownHeading || htmlHeading)) {
    return undefined;
  }

  if (!markdownHeading) {
    return htmlHeading?.title;
  }

  if (!htmlHeading) {
    return markdownHeading.title;
  }

  return markdownHeading.index <= htmlHeading.index
    ? markdownHeading.title
    : htmlHeading.title;
}

/** Reads a trimmed string frontmatter value, ignoring empty and non-string values. */
function stringFromFrontmatter(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Normalizes comma-separated or YAML-list tag frontmatter into strings. */
function tagsFromFrontmatter(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return undefined;
}

/** Returns true when a line starts top-level MDX import syntax. */
function isMdxImportStart(line: string) {
  const trimmed = line.trim();

  return /^import(?:\s+type)?\s+/.test(trimmed);
}

/** Returns true when a line starts top-level MDX export/module syntax. */
function isMdxExportStart(line: string) {
  return /^\s*export\s+(?:const|let|var|function|class|default|type|interface)\b/.test(
    line
  );
}

/** Heuristically detects the last line of a top-level MDX module statement. */
function isLikelyMdxModuleEnd(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return true;
  }

  if (trimmed.endsWith(";")) {
    return true;
  }

  if (/^}?\s*(?:from\s+["'][^"']+["'];?|;)\s*$/.test(trimmed)) {
    return true;
  }

  return /^};?\s*$/.test(trimmed);
}

/** Removes top-level MDX import/export statements before Markdown parsing. */
function stripMdxModuleSyntax(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let inFence = false;
  let skippingModule = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      output.push(line);
      continue;
    }

    if (inFence) {
      output.push(line);
      continue;
    }

    if (skippingModule) {
      if (isLikelyMdxModuleEnd(line)) {
        skippingModule = false;
      }
      continue;
    }

    if (isMdxImportStart(line) || isMdxExportStart(line)) {
      if (!isLikelyMdxModuleEnd(line)) {
        skippingModule = true;
      }
      continue;
    }

    output.push(line);
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Parses one Markdown/MDX file into the normalized import item shape. */
export function parseMarkdownImport(filename: string, markdown: string) {
  const parsed = matter(markdown);
  const content = stripMdxModuleSyntax(parsed.content || "");
  const title =
    stringFromFrontmatter(parsed.data.title) ||
    contentTitle(content) ||
    filenameTitle(filename);
  const fallbackSlug = generateSlug(title) || generateSlug(filename) || "post";

  return {
    sourceRef: filename,
    title: title || "Untitled",
    slug: stringFromFrontmatter(parsed.data.slug)
      ? generateSlug(String(parsed.data.slug))
      : fallbackSlug,
    content,
    description: stringFromFrontmatter(parsed.data.description) || "",
    rawCategory: stringFromFrontmatter(parsed.data.category),
    rawTags: tagsFromFrontmatter(parsed.data.tags),
    rawAuthor: stringFromFrontmatter(parsed.data.author),
  } satisfies ParsedMarkdownImport;
}

/** Extracts supported Markdown files from a zip archive in deterministic order. */
function parseMarkdownZipImport(bytes: Uint8Array) {
  const entries = unzipSync(bytes);
  const files = Object.entries(entries)
    .filter(([filename]) => {
      return isMarkdownImportFile(filename) && !isIgnoredZipEntry(filename);
    })
    .sort(([a], [b]) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error("Zip file must contain at least one .md or .mdx file");
  }

  if (files.length > MAX_ZIP_MARKDOWN_FILES) {
    throw new Error(
      `Zip file contains too many Markdown files. Maximum is ${MAX_ZIP_MARKDOWN_FILES}.`
    );
  }

  let extractedBytes = 0;

  return files.map(([sourceRef, contentBytes]) => {
    extractedBytes += contentBytes.byteLength;

    if (extractedBytes > MAX_ZIP_EXTRACTED_BYTES) {
      throw new Error("Extracted Markdown files are too large");
    }

    return {
      sourceRef,
      content: strFromU8(contentBytes),
    } satisfies ImportMarkdownFile;
  });
}

/** Reads an R2 object body as UTF-8 text for single-file imports. */
async function objectBodyToText(body: R2ObjectBody["body"]) {
  return await new Response(body).text();
}

/** Reads an R2 object body as bytes for zip extraction. */
async function objectBodyToBytes(body: R2ObjectBody["body"]) {
  return new Uint8Array(await new Response(body).arrayBuffer());
}

/** Reads uploaded Markdown directly, or extracts supported Markdown entries from a zip. */
export async function getImportMarkdownFiles({
  object,
  uploadKey,
}: {
  object: R2ObjectBody;
  uploadKey: string;
}) {
  if (uploadKey.toLowerCase().endsWith(".zip")) {
    const bytes = await objectBodyToBytes(object.body);
    return parseMarkdownZipImport(bytes);
  }

  return [
    {
      sourceRef: uploadKey,
      content: await objectBodyToText(object.body),
    },
  ] satisfies ImportMarkdownFile[];
}
