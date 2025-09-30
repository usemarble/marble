import { db } from "@marble/db";

type GetPostsParams = {
  limit: number;
  page: number;
  includeAuthor?: boolean;
  includeCategory?: boolean;
  includeTags?: boolean;
};

export async function getPosts({
  limit,
  page,
  includeAuthor,
  includeCategory,
  includeTags,
}: GetPostsParams) {

    
  return db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    include: {
      authors: includeAuthor,
      category: includeCategory,
      tags: includeTags,
    },
  });
}

export async function countPosts() {
  return db.post.count();
}
