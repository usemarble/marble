import { getSecret } from "astro:env/server";
import { Marble } from "@usemarble/sdk";

const key = getSecret("MARBLE_API_KEY");

if (!key) {
  throw new Error("Missing MARBLE_API_KEY in environment variables");
}

export const marble = new Marble({
  apiKey: key,
});

export async function listAllPosts(
  request: Parameters<typeof marble.posts.list>[0] = {}
) {
  const pages = await marble.posts.list({ ...request, limit: 100 });
  const posts: typeof pages.result.posts = [];

  for await (const page of pages) {
    posts.push(...page.result.posts);
  }

  return posts;
}

export async function listAllCategories() {
  const pages = await marble.categories.list({ limit: 100 });
  const categories: typeof pages.result.categories = [];

  for await (const page of pages) {
    categories.push(...page.result.categories);
  }

  return categories;
}
