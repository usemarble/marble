import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/lib/constants";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");
  const changelog = await getCollection("changelog");

  const blogItems = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: new Date(post.data.publishedAt),
    link: `/blog/${post.data.slug}`,
  }));

  const changelogItems = changelog.map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    pubDate: new Date(entry.data.publishedAt),
    link: `/changelog/${entry.data.slug}`,
  }));

  const allItems = [...blogItems, ...changelogItems].sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
  );

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site ?? SITE.URL,
    items: allItems,
  });
}
