import type { Category, CategoryDetails, Post, Posts } from "./schemas";

const key = import.meta.env.MARBLE_WORKSPACE_KEY;
const url = import.meta.env.MARBLE_API_URL;

type PostsResponse = {
  posts: Post[];
  pagination: {
    limit: number;
    currentPage: number;
    nextPage: number | null;
    previousPage: number | null;
    totalPages: number;
    totalItems: number;
  };
};

type CategoriesResponse = {
  categories: Category[];
};

type CategoryResponse = {
  category: CategoryDetails;
};

export async function fetchPosts(queryParams = ""): Promise<PostsResponse> {
  const fullUrl = `${url}/${key}/posts${queryParams}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`Failed to fetch posts from ${fullUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      });
      return {
        posts: [],
        pagination: {
          limit: 0,
          currentPage: 1,
          nextPage: null,
          previousPage: null,
          totalPages: 0,
          totalItems: 0,
        },
      };
    }

    const data = await response.json();
    return data as PostsResponse;
  } catch (error) {
    console.error(`Error fetching posts from ${fullUrl}:`, error);
    return {
      posts: [],
      pagination: {
        limit: 0,
        currentPage: 1,
        nextPage: null,
        previousPage: null,
        totalPages: 0,
        totalItems: 0,
      },
    };
  }
}

export async function fetchCategories(
  queryParams = ""
): Promise<CategoriesResponse> {
  const fullUrl = `${url}/${key}/categories${queryParams}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`Failed to fetch categories from ${fullUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      });
      return { categories: [] };
    }

    const data = await response.json();
    return data as CategoriesResponse;
  } catch (error) {
    console.error(`Error fetching categories from ${fullUrl}:`, error);
    return { categories: [] };
  }
}

export async function fetchCategory(
  identifier: string,
  queryParams = ""
): Promise<CategoryResponse | null> {
  const fullUrl = `${url}/${key}/categories/${identifier}${queryParams}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`Failed to fetch categories from ${fullUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      });
      return null;
    }

    const data = await response.json();
    return data as CategoryResponse;
  } catch (error) {
    console.error(`Error fetching categories from ${fullUrl}:`, error);
    return null;
  }
}
