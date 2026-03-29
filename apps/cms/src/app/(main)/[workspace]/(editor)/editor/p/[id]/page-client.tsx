"use client";

import { useParams } from "next/navigation";
import { EditorPageProvider } from "@/components/editor/editor-page-provider";
import EditorPage from "@/components/editor/editor-page";

function PageClient() {
  const params = useParams<{ id: string }>();

  return (
    <EditorPageProvider postId={params.id}>
      <EditorPage />
    </EditorPageProvider>
  );
}

export default PageClient;
