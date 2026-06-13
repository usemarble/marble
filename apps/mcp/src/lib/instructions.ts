/**
 * MCP server instructions: Marble workflows plus HTML sanitization rules for posts.
 */
export function getServerInstructions() {
  return `
## Marble / scope

Marble is a headless CMS. These tools manage posts, taxonomy (categories, tags), authors, and media in the workspace tied to the caller's Marble API key. Use HTTP tool responses as JSON: structured fields from the Marble API plus error details when requests fail — read the payload before assuming success.

For **datetimes**, use ISO 8601 strings (RFC 3339). **publishedAt** and similar fields are absolute instants. This MCP server does not expose a workspace timezone; if calendar-day boundaries matter, follow what the user states in conversation rather than inventing offsets.

## Critical post content format rule

Read tools may return post bodies as Markdown for readability or convenience, but mutating post tools do **not** accept Markdown for post content.

When calling **create_post** or **update_post**, the final **content** value must always be clean, semantic HTML.

Never write Markdown syntax such as:

- \`# Heading\`
- \`## Heading\`
- \`**bold**\`
- \`[link](https://example.com)\`
- \`- list item\`
- fenced code blocks using triple backticks

If the user provides Markdown, or if a read tool returned Markdown, convert it to clean HTML before calling **create_post** or **update_post**.

Do not round-trip Markdown from a read response directly into a write request.

## Authentication and mutating actions

Read-only listing and fetch tools work with keys that permit reads. **create_**, **update_**, **delete_**, **upload_** tools expect a **private** Marble API key with write access — if a call fails with authorization or permission errors, say so clearly and avoid retry loops with the same key.

Tools marked destructive in MCP metadata can remove or overwrite data — confirm destructive intent with the user when context is ambiguous.

Updating post content can overwrite existing work. Before large content edits, fetch the current post first and preserve unrelated fields unless the user explicitly asks to replace them.

## Tool families

Orient by prefix; schemas carry per-tool specifics:

- **get_posts**, **search_posts**, **get_post** — read articles; filter by status, categories, tags, featured. Returned body content may be HTML or Markdown depending on supported read options. Markdown is for reading/convenience only.
- **create_post**, **update_post** — write articles. The **content** field must be clean HTML. Never send Markdown to these tools.
- **delete_post** — remove articles; confirm intent when ambiguous.
- **get_categories**, **get_category**, **create_category**, **update_category**, **delete_category** — taxonomy. A category is required on **create_post**.
- **get_tags**, **get_tag**, **create_tag**, **update_tag**, **delete_tag** — labels; pass tag IDs/slugs on posts when attaching.
- **get_authors**, **get_author**, **create_author**, **update_author**, **delete_author** — contributors; omit **authors** on **create_post** to fall back to the first workspace author.
- **get_media**, **get_media_asset**, **upload_media_from_url**, **update_media**, **delete_media** — library assets; reuse stable URLs inside post HTML when applicable.

## Key patterns before editing content

Prefer **search_posts** or **get_posts** with **query** for discovery; use **get_post** for one record by ID/slug.

**Identifiers** throughout are **UUID or slug**, depending on the API shape returned in list responses.

**Pagination**: list tools accept **limit** (1–100) and **page**. Increase **page** when metadata indicates more rows.

Posts support **published**, **draft**, and **all** filters — include **draft** or **all** when the user needs drafts.

For new posts you need **categoryId** — resolve IDs with **get_categories** first when the user has not supplied one.

**tags** and **authors** are optional arrays of IDs already present in Marble.

Published times default when omitted. **create_post** uses “now” unless **publishedAt** is supplied. Supply **publishedAt** when backdating or scheduling needs to be explicit.

## Safe read/edit/write workflow for agents

When editing an existing post:

1. Find the post with **search_posts**, **get_posts**, or **get_post**.
2. Read the current post carefully.
3. Make the requested edit only.
4. Convert the final edited body to clean HTML.
5. Call **update_post** with HTML in the **content** field.
6. Preserve existing metadata unless the user asked to change it.

If the post was read as Markdown, treat it as a readable representation, not the write format.

Bad write content:

\`# My title\\n\\nThis is **bold** text.\`

Good write content:

\`<h1>My title</h1><p>This is <strong>bold</strong> text.</p>\`

## Post HTML and Marble's editor

When creating or updating posts, send clean HTML in the **content** field. Prefer semantic, editor-friendly HTML that survives Marble's sanitizer — avoid relying on markup Marble will strip before storage.

Use normal article HTML such as:

- \`<h1>\`, \`<h2>\`, \`<h3>\`
- \`<p>\`
- \`<strong>\`, \`<em>\`
- \`<a href="...">\`
- \`<ul>\`, \`<ol>\`, \`<li>\`
- \`<blockquote>\`
- \`<pre><code>...</code></pre>\`
- \`<figure>\`, \`<img>\`, \`<figcaption>\`

## Allowed tags and URLs

Allowed content tags include: p, h1, h2, h3, h4, h5, h6, strong, b, em, i, u, s, sub, sup, a, ul, ol, li, blockquote, pre, code, table, thead, tbody, tfoot, tr, th, td, img, figure, figcaption, video, track, iframe, div, span, mark, small, input, label, and hr.

Anchor **href** values may use **http**, **https**, **ftp**, or **mailto** URLs, same-page fragments such as **#introduction**, or root-relative internal paths such as **/pricing**.

Do not use scheme-relative links such as **//example.com**.

Images may use **http**, **https**, or **data** URLs.

Videos may use **http** or **https** URLs.

Iframes must use **https** and are restricted to YouTube hosts: **www.youtube.com** and **www.youtube-nocookie.com**.

Avoid class names, ids, JavaScript event handlers, scripts, arbitrary data attributes, and unknown inline styles — Marble strips unsupported markup before storing.

## Allowed attributes

Useful allowed attributes include:

- **a**: href, target
- **img**: src, alt
- **iframe**: src, allowfullscreen, style, width, height
- **figure**: data-width, data-align, data-type
- **video**: src, controls, preload, muted, loop, playsinline
- **track**: kind, src, srclang, label
- **code**: class
- **div**: data-twitter, data-src, data-youtube-video
- **span** and **mark**: style, data-color
- **input**: type, checked — only checkbox inputs are kept

## Allowed inline styles

Limited to **color**, **background-color**, and **text-decoration** with safe values.

Other style declarations may be removed.

## Figures, images, and video

Standalone images fit best wrapped for the editor:

\`<figure data-width="100" data-align="center"><img src="https://example.com/image.jpg" alt="Descriptive alt text"><figcaption>Optional caption</figcaption></figure>\`

Captions may contain inline links and inline formatting tags: \`<a>\`, \`<strong>\`, \`<b>\`, \`<em>\`, \`<i>\`, \`<s>\`, \`<u>\`, \`<code>\`, \`<span>\`, and \`<mark>\`. Use this for image credits or source attribution:

\`<figure data-width="100" data-align="center"><img src="https://example.com/image.jpg" alt="Mountain village at sunrise"><figcaption>Image by <a href="https://example.com/author">Author Name</a> on <a href="https://unsplash.com">Unsplash</a></figcaption></figure>\`

Inline formatting example:

\`<figure data-width="100" data-align="center"><img src="https://example.com/image.jpg" alt="Code editor screenshot"><figcaption><strong>Screenshot:</strong> command output from <code>marble dev</code></figcaption></figure>\`

Keep caption content inline; do not put headings, lists, tables, or other block structures inside \`<figcaption>\`.

Video:

\`<figure data-type="video" data-width="100" data-align="center"><video src="https://example.com/video.mp4" controls></video><figcaption>Optional caption</figcaption></figure>\`

Use **data-align** sparingly: **left**, **center**, or **right**.

Use **data-width** as a percentage-like string such as **"100"**.

## Embeds

YouTube embeds should use Marble's wrapper format:

\`<div data-youtube-video><iframe width="640" height="480" allowfullscreen="true" src="https://www.youtube.com/embed/VIDEO_ID"></iframe></div>\`

X/Twitter markers for Marble-aware rendering:

\`<div data-twitter data-src="https://x.com/username/status/1234567890"></div>\`

Consumers that dump raw HTML may need separate handling for Twitter markers — fallback to linking when unsure.

## Disallowed / unsafe markup

Never include:

- script tags
- onClick/onLoad-style event handlers
- javascript: URLs
- non-YouTube iframes
- unsupported attributes
- layout that depends entirely on stripped attributes
- raw Markdown in create/update post content

Prefer semantic HTML and let the site's theme handle styling.
`.trim();
}
