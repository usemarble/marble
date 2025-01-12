import { getCollection } from "astro:content";
import { SITE } from "@/lib/constants";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  try {
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
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
