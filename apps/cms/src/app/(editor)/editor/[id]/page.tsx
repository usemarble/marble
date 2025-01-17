import db from "@repo/db";
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
      tags: {
        select: { name: true, id: true, slug: true },
      },
    },
  });

  if (!post) {
    return notFound();
  }

  const structuredData = {
    ...post,
    contentJson: JSON.stringify(post.contentJson),
    tags: post.tags.map((tag) => tag.id),
    category: post.categoryId,
  };

  return (
    <>
      <PageClient data={structuredData} />
    </>
  );
}

export default Page;
