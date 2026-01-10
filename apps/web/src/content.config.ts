import { defineCollection } from "astro:content";
import { highlightContent } from "@marble/utils";
import { marble } from "./lib/marble";
import { categorySchema, postSchema } from "./lib/schemas";

const posts = defineCollection({
  loader: async () => {
    const { result } = await marble.posts.list({
      excludeCategories: "legal,changelog",
    });
    return Promise.all(
      result.posts.map(async (post) => ({
        ...post,
        content: await highlightContent(post.content),
      }))
    );
  },
  schema: postSchema,
});

const page = defineCollection({
  loader: async () => {
    const { result } = await marble.posts.list({ categories: "legal" });

    return result.posts.map((post) => ({
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
    const { result } = await marble.posts.list({ categories: "changelog" });

    return result.posts.map((post) => ({
      ...post,
      id: post.slug,
    }));
  },
  schema: postSchema,
});

const categories = defineCollection({
  loader: async () => {
    const { result } = await marble.categories.list();

    return result.categories.map((category) => ({
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
