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
      <section className="bg-background/90 w-full backdrop-blur-lg">
        <h1 className="text-center text-2xl font-bold capitalize">{site}</h1>
      </section>

      <PageClient articles={articles} site={site} />
    </>
  );
}

export default Page;
