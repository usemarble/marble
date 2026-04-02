"use client";

import { useParams } from "next/navigation";
import { EditorDataProvider } from "@/components/editor/editor-data-provider";
import EditorPage from "@/components/editor/editor-page";

function PageClient() {
  const params = useParams<{ id: string }>();

  return (
    <EditorDataProvider postId={params.id}>
      <EditorPage />
    </EditorDataProvider>
  );
}

export default PageClient;
