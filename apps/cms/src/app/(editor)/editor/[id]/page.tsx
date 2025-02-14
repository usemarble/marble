import type { Attribution } from "@/lib/validations/post";
import db from "@marble/db";
import { notFound } from "next/navigation";
import PageClient from "./page-client";

async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const post = await db.post.findUnique({
    where: { id: id },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      content: true,
      coverImage: true,
      description: true,
      publishedAt: true,
      contentJson: true,
      categoryId: true,
      attribution: true,
      tags: {
        select: { name: true, id: true, slug: true },
      },
    },
  });

  if (!post) {
    return notFound();
  }

  const structuredData = {
    slug: post.slug,
    title: post.title,
    status: post.status,
    content: post.content,
    coverImage: post.coverImage,
    description: post.description,
    publishedAt: post.publishedAt,
    attribution: post.attribution as Attribution,
    contentJson: JSON.stringify(post.contentJson),
    tags: post.tags.map((tag) => tag.id),
    category: post.categoryId,
  };

  return (
    <>
      <PageClient data={structuredData} id={post.id} />
    </>
  );
}

export default Page;
