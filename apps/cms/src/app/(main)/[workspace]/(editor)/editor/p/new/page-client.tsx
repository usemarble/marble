"use client";

import { EditorDataProvider } from "@/components/editor/editor-data-provider";
import EditorPage from "@/components/editor/editor-page";

function NewPostPageClient() {
  return (
    <EditorDataProvider>
      <EditorPage />
    </EditorDataProvider>
  );
}

export default NewPostPageClient;
