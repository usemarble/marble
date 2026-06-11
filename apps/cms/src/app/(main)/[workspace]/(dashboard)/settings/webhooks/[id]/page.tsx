import WebhookDetailPage from "./page-client";

export const metadata = {
  title: "Webhook",
};

interface PageProps {
  params: Promise<{ id: string; workspace: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id, workspace } = await params;

  return <WebhookDetailPage id={id} workspace={workspace} />;
}
