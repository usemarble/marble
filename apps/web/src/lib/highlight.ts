import { createHighlighter } from "shiki";

// Create highlighter instance
// Should be a singleton
// https://shiki.style/guide/install#highlighter-usage
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark"],
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
      ],
    });
  }
  return highlighter;
}

/**
 * Transform content from Marble to add syntax highlighting to code blocks
 */
export async function highlightContent(htmlContent: string): Promise<string> {
  const highlighter = await getHighlighter();

  // Marble returns the language as a class attribute on the <code> tag
  // i.e <pre><code class="language-jsx">...</code></pre>
  // so we use a regex to find and pick the language from the classname
  const codeBlockRegex =
    /<pre><code(?:\s+class="language-([^"]+)")?[^>]*>([\s\S]*?)<\/code><\/pre>/g;

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
        theme: "github-dark",
      });

      return highlighted;
    } catch (error) {
      console.warn("Failed to highlight code block:", error);
      // We return the original content if highlighting fails
      return match;
    }
  });
}
