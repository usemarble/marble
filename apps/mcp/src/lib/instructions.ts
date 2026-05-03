export const SERVER_INSTRUCTIONS = `
Use Marble tools to read and manage content in a Marble CMS workspace.

When creating or updating posts, send clean HTML in the content field. Prefer semantic, editor-friendly HTML that will survive Marble's sanitizer.

Allowed content tags include: p, h1, h2, h3, h4, h5, h6, strong, b, em, i, u, s, sub, sup, a, ul, ol, li, blockquote, pre, code, table, thead, tbody, tfoot, tr, th, td, img, figure, figcaption, video, track, iframe, div, span, mark, small, input, label, and hr.

Allowed URL schemes are http, https, ftp, and mailto. Images may use http, https, or data URLs. Videos may use http or https URLs. Iframes must use https and are restricted to YouTube hosts: www.youtube.com and www.youtube-nocookie.com.

Allowed attributes are intentionally limited. Avoid class names, ids, JavaScript event handlers, scripts, arbitrary data attributes, and unknown inline styles because Marble strips unsupported markup before storing content.

Useful allowed attributes:
- a: href, target
- img: standard safe image attributes from the sanitizer defaults, such as src and alt
- iframe: src, allowfullscreen, style, width, height
- figure: src, alt, data-width, caption, data-align, data-type
- video: src, controls, preload, muted, loop, playsinline
- track: kind, src, srclang, label
- code: class
- div: data-twitter, data-src, data-youtube-video
- span and mark: style, data-color
- input: type, checked. Only checkbox inputs are kept.

Allowed inline styles are limited to color, background-color, and text-decoration with safe values. Other style declarations may be removed.

Images can be sent as plain img tags, but for best compatibility with Marble's editor and captions, prefer wrapping standalone images in figure tags:
<figure data-width="100" data-align="center"><img src="https://example.com/image.jpg" alt="Descriptive alt text"><figcaption>Optional caption</figcaption></figure>

Videos can be sent as plain video tags, but for best compatibility with Marble's editor and captions, prefer:
<figure data-type="video" data-width="100" data-align="center"><video src="https://example.com/video.mp4" controls></video><figcaption>Optional caption</figcaption></figure>

Use data-align only for figure alignment when helpful. Common values are left, center, and right. Use data-width as a percentage-like number such as "100".

For YouTube embeds, use the same shape Marble's editor stores: a div with data-youtube-video containing a YouTube iframe. Use an allowed YouTube host and an embed URL:
<div data-youtube-video><iframe width="640" height="480" allowfullscreen="true" src="https://www.youtube.com/embed/VIDEO_ID"></iframe></div>

For X/Twitter embeds, use the same shape Marble's editor stores: an empty div with data-twitter and data-src set to the X post URL:
<div data-twitter data-src="https://x.com/username/status/1234567890"></div>
X/Twitter embed markers are intended for Marble-aware renderers. Sites that render raw HTML directly may need to transform these markers into a tweet component, X widget, or fallback link.

Do not include script tags, onClick/onLoad-style event handlers, javascript: URLs, non-YouTube iframes, unsupported attributes, or layout-critical styling that depends on stripped attributes. If custom styling is important, use semantic HTML and let the user's site theme handle presentation.
`.trim();
