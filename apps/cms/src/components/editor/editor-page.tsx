"use client";

import { MarbleEditorMenus } from "@/components/editor/editor";
import { EditorHeader } from "@/components/editor/editor-header";
import { useEditorPage } from "@/components/editor/editor-page-provider";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { ErrorMessage } from "@/components/ui/error-message";
import { HiddenScrollbar } from "@/components/ui/hidden-scrollbar";
import { useDebounce } from "@/hooks/use-debounce";
import { MAX_MEDIA_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import type { PostEditorValues } from "@/lib/validations/post";
import "@/styles/editor.css";
import {
  EditorContext,
  ImageUpload,
  type JSONContent,
  type MediaPage,
  useMarbleEditor,
  VideoUpload,
} from "@marble/editor";
import { SidebarInset, useSidebar } from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { MediaListResponse } from "@/types/media";
import { generateSlug } from "@/utils/string";
import { TextareaAutosize } from "./textarea-autosize";

function EditorPageContent() {
  "use no memo";
  const params = useParams<{ workspace: string }>();
  const { open, isMobile } = useSidebar();
  const { mode, postId } = useEditorPage();
  const {
    clearErrors,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<PostEditorValues>();

  const title = watch("title");
  const content = watch("content");
  const debouncedTitle = useDebounce(title || "", 300);

  useEffect(() => {
    if (debouncedTitle && mode === "create") {
      const slug = generateSlug(debouncedTitle);
      setValue("slug", slug, {
        shouldDirty: true,
      });
      clearErrors("slug");
    }
  }, [clearErrors, debouncedTitle, mode, setValue]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadFile({ file, type: "media" });
    if (!result?.url) {
      throw new Error("Upload failed: Invalid response from server.");
    }
    return result.url;
  }, []);

  const handleVideoUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadFile({ file, type: "media" });
    if (!result?.url) {
      throw new Error("Upload failed: Invalid response from server.");
    }
    return result.url;
  }, []);

  const fetchMediaPage = useCallback(
    async (cursor?: string): Promise<MediaPage> => {
      try {
        const url = cursor
          ? `/api/media?cursor=${encodeURIComponent(cursor)}`
          : "/api/media";
        const response = await fetch(url);
        if (!response.ok) {
          return { media: [] };
        }
        const data: MediaListResponse = await response.json();
        return {
          media: data.media.map((item) => ({
            id: item.id,
            url: item.url,
            name: item.name,
            type: item.type as "image" | "video" | "file",
          })),
          nextCursor: data.nextCursor,
        };
      } catch {
        return { media: [] };
      }
    },
    []
  );

  const handleUploadError = useCallback((error: Error) => {
    toast.error(`Upload failed: ${error.message}`);
  }, []);

  const handleEditorUpdate = useCallback(
    ({
      editor,
    }: {
      editor: { getHTML: () => string; getJSON: () => JSONContent };
    }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      if (html.length > 0) {
        clearErrors("content");
      }
      setValue("content", html, { shouldDirty: true, shouldValidate: true });
      setValue("contentJson", JSON.stringify(json), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [clearErrors, setValue]
  );

  const editor = useMarbleEditor({
    content: content || "",
    placeholder: "Start typing or press '/' for commands",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert min-h-96 h-full sm:px-4 focus:outline-hidden max-w-full prose-blockquote:border-border",
      },
      transformPastedHTML(html) {
        const cleaned = html
          .replace(/<img[^>]*\ssrc=["']data:image\/[^"']*["'][^>]*\/?>/gi, "")
          .replace(
            /<video[^>]*\ssrc=["']data:video\/[^"']*["'][^>]*>.*?<\/video>/gi,
            ""
          );
        const doc = new DOMParser().parseFromString(cleaned, "text/html");
        for (const el of Array.from(doc.querySelectorAll("img, video"))) {
          if (!el.closest("figure")) {
            const figure = doc.createElement("figure");
            const figcaption = doc.createElement("figcaption");
            el.parentNode?.insertBefore(figure, el);
            figure.appendChild(el);
            figure.appendChild(figcaption);
          }
        }
        return doc.body.innerHTML;
      },
    },
    extensions: [
      ImageUpload.configure({
        accept: "image/*",
        maxSize: MAX_MEDIA_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: handleUploadError,
        fetchMediaPage,
      }),
      VideoUpload.configure({
        accept: "video/*",
        maxSize: MAX_MEDIA_FILE_SIZE,
        upload: handleVideoUpload,
        onError: handleUploadError,
        fetchMediaPage,
      }),
    ],
    onUpdate: handleEditorUpdate,
  });
  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <SidebarInset className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] rounded-xl border bg-editor-content-background shadow-xs">
        <EditorHeader postId={postId} workspace={params.workspace} />
        <section className="mx-auto w-full max-w-3xl flex-1">
          <HiddenScrollbar className="h-[calc(100vh-7rem)]">
            <form
              className="space-y-5 rounded-md p-4"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div className="flex flex-col">
                <label className="sr-only" htmlFor="title">
                  Enter post your title
                </label>

                <TextareaAutosize
                  id="title"
                  placeholder="Title"
                  {...register("title")}
                  className="scrollbar-hide mb-2 w-full resize-none bg-transparent font-semibold prose-headings:font-semibold text-4xl focus:outline-hidden focus:ring-0 sm:px-4"
                  onEnterPress={() => {
                    editor
                      ?.chain()
                      .focus()
                      .insertContentAt(0, { type: "paragraph" })
                      .focus("start")
                      .run();
                  }}
                />
                {errors.title && (
                  <ErrorMessage className="text-sm">
                    {errors.title.message}
                  </ErrorMessage>
                )}
              </div>
              <div className="flex flex-col">
                <MarbleEditorMenus />

                {errors.content && (
                  <ErrorMessage className="text-sm">
                    {errors.content.message}
                  </ErrorMessage>
                )}
              </div>
            </form>
          </HiddenScrollbar>
        </section>
      </SidebarInset>
      {!isMobile && (
        <div
          className={cn(
            "h-svh transition-[width] ease-linear",
            open ? "w-2" : "w-0"
          )}
        />
      )}
      <EditorSidebar />
    </EditorContext.Provider>
  );
}

function EditorPage() {
  return <EditorPageContent />;
}

export default EditorPage;
