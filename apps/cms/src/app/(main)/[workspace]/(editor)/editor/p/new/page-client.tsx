"use client";

import { useQuery } from "@tanstack/react-query";
import EditorPage from "@/components/editor/editor-page";
import PageLoader from "@/components/shared/page-loader";
import { emptyPost } from "@/lib/data/post";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";

function NewPostPageClient() {
  const { user } = useUser();
  const { activeWorkspace } = useWorkspace();

  // Fetch current user's author record for the active workspace
  const { data: userAuthor, isLoading } = useQuery({
    queryKey: ["userAuthor", activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const response = await fetch("/api/authors");
      if (!response.ok) return null;

      const authors = await response.json();
      return authors.find((author: any) => author.userId === user?.id) || null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const initialPostData: PostValues = {
    ...emptyPost,
    authors: userAuthor?.id ? [userAuthor.id] : emptyPost.authors || [],
  };

  return <EditorPage initialData={initialPostData} />;
}

export default NewPostPageClient;
