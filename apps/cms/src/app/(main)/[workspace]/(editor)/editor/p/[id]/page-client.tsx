"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import EditorPage from "@/components/editor/editor-page";
import PageLoader from "@/components/shared/page-loader";
import type { PostValues } from "@/lib/validations/post";

function PageClient() {
  const params = useParams<{ id: string }>();

  const { data: postData, isLoading } = useQuery({
    queryKey: ["post", params.id],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch(`/api/posts/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch post");
      }
      const data: PostValues = await res.json();
      return data;
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!postData) {
    return notFound();
  }

  const postDataWithDate = {
    ...postData,
    publishedAt: new Date(postData.publishedAt),
  };

  return <EditorPage id={params.id} initialData={postDataWithDate} />;
}

export default PageClient;
