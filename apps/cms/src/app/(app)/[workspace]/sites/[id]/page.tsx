import db from "@repo/db";
import PageClient from "./page-client";

async function Page(props: { params: Promise<{ site: string }> }) {
  const params = await props.params;
  const { site } = params;

  const articles = await db.post.findMany({
    where: { siteId: site },
    select: { id: true, title: true, description: true, createdAt: true },
  });

  return (
    <>
      <PageClient articles={articles} siteId={site} />
    </>
  );
}

export default Page;
