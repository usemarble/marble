"use client";

import EditorPage from "@/components/editor/editor-page";
import { useSession } from "@/lib/auth/client";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";

function NewPostPageClient() {
  const { data: session } = useSession();

  const initialPostData: PostValues = {
    ...emptyPost,
    authors: session?.user?.id ? [session.user.id] : emptyPost.authors || [],
  };

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
