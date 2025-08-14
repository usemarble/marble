"use client";

import { useMemo } from "react";
import EditorPage from "@/components/editor/editor-page";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";

function NewPostPageClient() {
  const { user } = useUser();

  const initialPostData: PostValues = useMemo(
    () => ({
      ...emptyPost,
      authors: user?.id ? [user.id] : emptyPost.authors || [],
    }),
    [user?.id],
  );

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
