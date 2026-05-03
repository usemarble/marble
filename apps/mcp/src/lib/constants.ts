export const DEFAULT_API_BASE_URL = "https://api.marblecms.com";

export const MCP_TOOL_GROUPS = [
  {
    name: "Posts",
    description: "Read, search, create, update, and delete Marble posts.",
    tools: [
      {
        name: "get_posts",
        description:
          "Get a paginated list of Marble posts with optional filters.",
      },
      {
        name: "search_posts",
        description: "Search posts by title and content.",
      },
      { name: "get_post", description: "Get a single post by ID or slug." },
      { name: "create_post", description: "Create a new post." },
      {
        name: "update_post",
        description: "Update an existing post by ID or slug.",
      },
      { name: "delete_post", description: "Delete a post by ID or slug." },
    ],
  },
  {
    name: "Categories",
    description: "Manage categories in your Marble workspace.",
    tools: [
      {
        name: "get_categories",
        description: "Get a paginated list of categories.",
      },
      {
        name: "get_category",
        description: "Get a single category by ID or slug.",
      },
      { name: "create_category", description: "Create a new category." },
      {
        name: "update_category",
        description: "Update an existing category by ID or slug.",
      },
      {
        name: "delete_category",
        description: "Delete a category by ID or slug.",
      },
    ],
  },
  {
    name: "Tags",
    description: "Manage tags in your Marble workspace.",
    tools: [
      { name: "get_tags", description: "Get a paginated list of tags." },
      { name: "get_tag", description: "Get a single tag by ID or slug." },
      { name: "create_tag", description: "Create a new tag." },
      {
        name: "update_tag",
        description: "Update an existing tag by ID or slug.",
      },
      { name: "delete_tag", description: "Delete a tag by ID or slug." },
    ],
  },
  {
    name: "Authors",
    description: "Manage authors in your Marble workspace.",
    tools: [
      { name: "get_authors", description: "Get a paginated list of authors." },
      { name: "get_author", description: "Get a single author by ID or slug." },
      { name: "create_author", description: "Create a new author." },
      {
        name: "update_author",
        description: "Update an existing author by ID or slug.",
      },
      { name: "delete_author", description: "Delete an author by ID or slug." },
    ],
  },
] as const;
