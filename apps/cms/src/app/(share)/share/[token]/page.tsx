import { highlightContent } from "@marble/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ShareData, ShareStatus } from "@/types/share";
import SharePageClient from "./page-client";

export const metadata: Metadata = {
  title: "Shared Post",
  description: "View a shared draft post",
};

interface SharePageProps {
  params: Promise<{ token: string }>;
}

async function fetchShareData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/share/${token}`,
    {
      cache: "force-cache",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (response.status === 410) {
    return { status: "expired" as ShareStatus };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch share data: ${response.statusText}`);
  }

  const data = await response.json();

  const highlightedContent = await highlightContent(data.post.content);

  return {
    data: {
      ...data,
      post: {
        ...data.post,
        content: highlightedContent,
      },
    } as ShareData,
  };
}

async function SharePage(props: SharePageProps) {
  const params = await props.params;
  const { token } = params;

  const result = await fetchShareData(token);

  if (!result) {
    notFound();
  }

  if (result.status === "expired") {
    return <SharePageClient status="expired" />;
  }

  return <SharePageClient data={result.data} />;
}

export default SharePage;
