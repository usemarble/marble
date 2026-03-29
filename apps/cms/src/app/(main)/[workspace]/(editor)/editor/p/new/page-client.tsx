"use client";

import EditorPage from "@/components/editor/editor-page";
import { EditorPageProvider } from "@/components/editor/editor-page-provider";

function NewPostPageClient() {
  return (
    <EditorPageProvider>
      <EditorPage />
    </EditorPageProvider>
  );
}

export default NewPostPageClient;
