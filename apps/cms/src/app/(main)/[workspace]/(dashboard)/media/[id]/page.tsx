import MediaDetailPage from "./page-client";

export const metadata = {
  title: "Media",
  description: "Manage your media",
};

export default async function Page(props: {
  params: Promise<{ id: string; workspace: string }>;
}) {
  const { id, workspace } = await props.params;

  return <MediaDetailPage id={id} workspace={workspace} />;
}
