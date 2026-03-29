"use client";

import { useParams } from "next/navigation";
import EditorPage from "@/components/editor/editor-page";
import { EditorPageProvider } from "@/components/editor/editor-page-provider";

function PageClient() {
  const params = useParams<{ id: string }>();

  return (
    <EditorPageProvider postId={params.id}>
      <EditorPage />
    </EditorPageProvider>
  );
}

export default PageClient;
