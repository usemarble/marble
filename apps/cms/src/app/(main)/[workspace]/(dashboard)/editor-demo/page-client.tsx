"use client";

import {
  EditorContext,
  ImageUpload,
  type MediaItem,
  useMarbleEditor,
} from "@marble/editor";
import { useCallback, useMemo } from "react";
import { MarbleEditorMenus } from "@/components/editor/editor";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { MAX_MEDIA_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import type { MediaListResponse } from "@/types/media";

function PageClient() {
  // Image upload handler
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadFile({ file, type: "media" });
    if (!result?.url) {
      throw new Error("Upload failed: Invalid response from server.");
    }
    return result.url;
  }, []);

  // Fetch media handler
  const fetchMedia = useCallback(async (): Promise<MediaItem[]> => {
    try {
      const res = await fetch("/api/media");
      if (!res.ok) {
        return [];
      }
      const data: MediaListResponse = await res.json();
      return data.media.map((item) => ({
        id: item.id,
        url: item.url,
        name: item.name,
        type: item.type as "image" | "video" | "file",
      }));
    } catch {
      return [];
    }
  }, []);

  // Handle upload errors
  const handleUploadError = useCallback((error: Error) => {
    console.error("Upload failed:", error);
  }, []);

  const editor = useMarbleEditor({
    content: "",
    placeholder: "Start typing or press '/' for commands",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert min-h-96 h-full sm:px-4 focus:outline-hidden max-w-full prose-blockquote:border-border",
      },
    },
    extensions: [
      ImageUpload.configure({
        accept: "image/*",
        maxSize: MAX_MEDIA_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: handleUploadError,
        fetchMedia,
      }),
    ],
  });

  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  return (
    <WorkspacePageWrapper
      className="flex flex-col gap-8 pt-10 pb-16"
      size="compact"
    >
      <div className="flex flex-col gap-4">
        <h1 className="font-bold text-3xl">Editor Demo</h1>
        <p className="text-muted-foreground">Testing page will delete later.</p>
      </div>

      <EditorContext.Provider value={editorContextValue}>
        <MarbleEditorMenus />
      </EditorContext.Provider>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
