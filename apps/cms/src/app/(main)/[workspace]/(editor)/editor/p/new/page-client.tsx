"use client";

import { EditorPageProvider } from "@/components/editor/editor-page-provider";
import EditorPage from "@/components/editor/editor-page";

function NewPostPageClient() {
  return (
    <EditorPageProvider>
      <EditorPage />
    </EditorPageProvider>
  );
}

export default NewPostPageClient;
