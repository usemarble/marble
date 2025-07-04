"use client";

import EditorPage from "@/components/editor/editor-page";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";

function NewPostPageClient() {
  const { user } = useUser();

  const initialPostData: PostValues = {
    ...emptyPost,
    authors: user?.id ? [user.id] : emptyPost.authors || [],
  };

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
