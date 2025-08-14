"use client";

import type { JSX } from "react";
import EditorPage from "@/components/editor/editor-page";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";

/**
 * Client component for creating a new post.
 *
 * This component initializes the post editor with default values and
 * automatically sets the current user as the author if available.
 *
 * @returns JSX element containing the post editor with initial data
 */
function NewPostPageClient(): JSX.Element {
  const { user } = useUser();

  const initialPostData: PostValues = {
    ...emptyPost,
    authors: user?.id ? [user.id] : emptyPost.authors,
  };

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
