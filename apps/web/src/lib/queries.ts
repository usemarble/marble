import type { Category, Post } from "./schemas";

const key = import.meta.env.MARBLE_WORKSPACE_KEY;
const url = import.meta.env.MARBLE_API_URL;

export async function fetchPosts(queryParams = ""): Promise<Post[]> {
  const fullUrl = `${url}/${key}/posts${queryParams}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`Failed to fetch posts from ${fullUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      });
      return [];
    }

    const data = await response.json();
    return data.posts as Post[];
  } catch (error) {
    console.error(`Error fetching posts from ${fullUrl}:`, error);
    return [];
  }
}

export async function fetchCategories(queryParams = ""): Promise<Category[]> {
  const fullUrl = `${url}/${key}/categories${queryParams}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`Failed to fetch categories from ${fullUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      });
      return [];
    }

    const data = await response.json();
    return data.categories as Category[];
  } catch (error) {
    console.error(`Error fetching categories from ${fullUrl}:`, error);
    return [];
  }
}
