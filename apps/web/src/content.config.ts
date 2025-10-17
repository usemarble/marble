import { defineCollection, z } from "astro:content";
import { highlightContent } from "./lib/highlight";
import { fetchCategories, fetchPosts } from "./lib/queries";
import { categorySchema, postSchema } from "./lib/schemas";

const posts = defineCollection({
  loader: async () => {
    const posts = await fetchPosts("?exclude=legal");
    // Must return an array of entries with an id property
    // or an object with IDs as keys and entries as values
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
    const posts = await fetchPosts("?category=legal");

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
    const posts = await fetchPosts("?category=changelog");

    return posts.map((post) => ({
      ...post,
      id: post.slug,
    }));
  },
  schema: postSchema,
});

const categories = defineCollection({
  loader: async () => {
    const categories = await fetchCategories("?include=posts");

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
