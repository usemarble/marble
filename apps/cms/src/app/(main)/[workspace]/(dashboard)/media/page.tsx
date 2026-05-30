import { notFound } from "next/navigation";
import { getDashboardMedia } from "@/lib/queries/dashboard/media";
import { getDashboardWorkspaceId } from "@/lib/queries/dashboard/workspace";
import { loadMediaPageFilters } from "@/lib/search-params";
import { toMediaType } from "@/utils/media";
import PageClient from "./page-client";

export const metadata = {
  title: "Media",
  description: "Manage your media",
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
    searchParams.then((paramsValue) => loadMediaPageFilters(paramsValue)),
  ]);
  const workspaceId = await getDashboardWorkspaceId(workspace);
  if (!workspaceId) {
    notFound();
  }

  const mediaKey = {
    page: filters.page,
    perPage: filters.perPage,
    search: filters.search,
    sort: filters.sort,
    type: toMediaType(filters.type),
  };
  const media = await getDashboardMedia(workspaceId, {
    page: filters.page,
    perPage: filters.perPage,
    search: filters.search || null,
    sort: filters.sort,
    type: mediaKey.type,
  });
  return (
    <PageClient
      initialMedia={media}
      initialMediaKey={JSON.stringify(mediaKey)}
    />
  );
}

export default Page;
