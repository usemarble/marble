import { notFound } from "next/navigation";
import { getDashboardPosts } from "@/lib/queries/dashboard/posts";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import { loadPostApiFilters } from "@/lib/search-params";
import PageClient from "./page-client";

export const metadata = {
  title: "Posts",
  description: "Manage your posts",
};

async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ workspace }, filters] = await Promise.all([
    params,
    searchParams.then((paramsValue) => loadPostApiFilters(paramsValue)),
  ]);
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const posts = await getDashboardPosts(workspaceId, filters);
  return (
    <PageClient
      initialPosts={posts}
      initialPostsKey={JSON.stringify(filters)}
    />
  );
}

export default Page;
