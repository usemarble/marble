import { defineCollection } from "astro:content";
import { highlightContent } from "@marble/utils";
import { listAllCategories, listAllPosts } from "./lib/marble";
import { categorySchema, postSchema } from "./lib/schemas";

const posts = defineCollection({
  loader: async () => {
    const posts = await listAllPosts({
      excludeCategories: ["legal", "changelog"],
    });
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        content: await highlightContent(post.content),
      }))
    );
  },
  schema: postSchema,
});

const page = defineCollection({
  loader: async () => {
    const posts = await listAllPosts({ categories: ["legal"] });

    return posts.map((post) => ({
      ...post,
      // Astro uses the id as a key to get the entry
      // We can't know the id of the post so we use the slug
      id: post.slug,
    }));
  },
  schema: postSchema,
});

const changelog = defineCollection({
  loader: async () => {
    const posts = await listAllPosts({ categories: ["changelog"] });

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        id: post.slug,
        content: await highlightContent(post.content),
      }))
    );
  },
  schema: postSchema,
});

const categories = defineCollection({
  loader: async () => {
    const categories = await listAllCategories();

    return categories.map((category) => ({
      ...category,
      id: category.slug,
    }));
  },
  schema: categorySchema,
});

export const collections = {
  posts,
  page,
  changelog,
  categories,
};
