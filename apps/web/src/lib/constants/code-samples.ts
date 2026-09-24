/**
 * Code shown on the framework and headless CMS landing pages.
 *
 * The Next.js and Astro samples were built and run against @usemarble/sdk
 * 1.3.0, Next.js 16, and Astro 7 with a real workspace. Keep them in step with
 * the integration guides and example repos, and re-test after SDK changes.
 *
 * Samples live here rather than in the .astro pages because the formatter
 * rewrites template literals inside Astro frontmatter.
 */

export const NEXTJS_POST_PAGE = `import { Marble } from "@usemarble/sdk";
import { notFound } from "next/navigation";

const marble = new Marble({ apiKey: process.env.MARBLE_API_KEY });

// Refresh at most once an hour, or on demand from a webhook
export const revalidate = 3600;

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { post } = await marble.posts
    .get({ identifier: slug })
    .catch(() => notFound());

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}`;

export const ASTRO_CONFIG = `import { defineCollection } from "astro:content";
import { Marble } from "@usemarble/sdk";

const marble = new Marble({
  apiKey: import.meta.env.MARBLE_API_KEY,
});

const posts = defineCollection({
  loader: async () => {
    const pages = await marble.posts.list({ limit: 100 });
    const posts = [];

    for await (const page of pages) {
      posts.push(...page.result.posts);
    }

    return posts;
  },
});

export const collections = { posts };`;

/** Shape matches GET /v1/posts/:identifier; the values are illustrative. */
export const API_POST_RESPONSE = `{
  "post": {
    "id": "cmpb2ua350000psp7urk7c9u6",
    "slug": "launch-week-recap",
    "title": "Launch week recap",
    "status": "published",
    "description": "Everything we shipped this week.",
    "coverImage": "https://cdn.marblecms.com/media/.../cover.webp",
    "publishedAt": "2026-09-01T09:00:00.000Z",
    "category": { "name": "Product", "slug": "product" },
    "tags": [{ "name": "Releases", "slug": "releases" }],
    "authors": [{ "name": "Ada Lovelace", "slug": "ada" }],
    "fields": { "release_date": "2026-09-01" },
    "content": "<p>This week we shipped...</p>"
  }
}`;
