import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/lib/constants";

export async function GET(context: APIContext) {
	const blog = await getCollection("posts");

	const posts = [...blog].sort(
		(a, b) =>
			new Date(b.data.publishedAt).valueOf() -
			new Date(a.data.publishedAt).valueOf(),
	);

	return rss({
		title: SITE.TITLE,
		description: SITE.DESCRIPTION,
		site: context.site ?? SITE.URL,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: new Date(post.data.publishedAt),
			link: `/blog/${post.data.slug}/`,
		})),
	});
}
