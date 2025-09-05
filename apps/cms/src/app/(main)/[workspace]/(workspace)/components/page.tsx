import { PageClient } from "./page-client";

export default async function ComponentsPage({
  params,
}: {
  params: { workspace: string };
}) {

  const { workspace } = params;

  return <PageClient />;
}