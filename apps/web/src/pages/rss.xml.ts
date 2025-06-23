import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/lib/constants";

export async function GET(context: APIContext) {
  const blog = await getCollection("blog");

  const posts = [...blog].sort(
    (a, b) =>
      new Date(b.data.published).valueOf() -
      new Date(a.data.published).valueOf(),
  );

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site ?? SITE.URL,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.published),
      link: `/${post.collection}/${post.id}/`,
    })),
  });
}
