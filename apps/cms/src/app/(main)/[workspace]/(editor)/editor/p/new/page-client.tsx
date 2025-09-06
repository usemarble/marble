"use client";

import EditorPage from "@/components/editor/editor-page";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";

function NewPostPageClient() {
  const initialPostData: PostValues = {
    ...emptyPost,
    authors: [],
  };

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
