import { createHighlighter } from "shiki";

// Cache the initialization promise, not just the resolved highlighter. This
// prevents concurrent callers from creating multiple instances while the
// first highlighter is still loading.
// https://shiki.style/guide/install#highlighter-usage
let highlighterPromise:
  | Promise<Awaited<ReturnType<typeof createHighlighter>>>
  | undefined;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "javascript",
        "typescript",
        "json",
        "html",
        "css",
        "bash",
        "shell",
        "jsx",
        "tsx",
        "markdown",
        "yaml",
        "xml",
        "python",
        "java",
        "c",
        "cpp",
        "csharp",
        "php",
        "ruby",
        "go",
        "rust",
        "swift",
        "kotlin",
        "scala",
        "sql",
        "dockerfile",
        "diff",
        "plaintext",
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Transform content from Marble to add syntax highlighting to code blocks
 */
export async function highlightContent(
  htmlContent: string,
  theme: "light" | "dark" = "dark"
): Promise<string> {
  const highlighter = await getHighlighter();

  // Marble returns the language as a class attribute on the <code> tag
  // i.e <pre><code class="language-jsx">...</code></pre>
  // so we use a regex to find and pick the language from the classname
  const codeBlockRegex =
    /<pre[^>]*>\s*<code(?:\s+[^>]*?class="[^"]*?language-([^"\s]+)[^"]*?")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g;

  return htmlContent.replace(codeBlockRegex, (match, language, code) => {
    try {
      // Decode HTML entities in the code
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Use detected language or default to text if none specified
      const lang = language || "text";

      // Check if the language is supported
      const supportedLanguages = highlighter.getLoadedLanguages();
      const finalLang = supportedLanguages.includes(lang) ? lang : "text";

      const highlighted = highlighter.codeToHtml(decodedCode, {
        lang: finalLang,
        theme: theme === "dark" ? "github-dark" : "github-light",
      });

      return highlighted;
    } catch (error) {
      console.warn("Failed to highlight code block:", error);
      // We return the original content if highlighting fails
      return match;
    }
  });
}
