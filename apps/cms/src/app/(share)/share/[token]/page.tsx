import { notFound } from "next/navigation";
import type { ShareData, ShareStatus } from "@/types/share";
import { highlightContent } from "@/utils/highlight";
import SharePageClient from "./page-client";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

async function fetchShareData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/share/${token}`,
    {
      cache: "force-cache",
    },
  );

  if (response.status === 404) {
    notFound();
  }

  if (response.status === 410) {
    return { status: "expired" as ShareStatus };
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

  try {
    const result = await fetchShareData(token);

    if (result.status === "expired") {
      return <SharePageClient status="expired" />;
    }

    return <SharePageClient data={result.data} />;
  } catch (error) {
    console.error("Error fetching link data:", error);
    notFound();
  }
}

export default SharePage;
