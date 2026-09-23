"use client";

import { MarbleEditorMenus } from "@/components/editor/editor";
import { useEditorData } from "@/components/editor/editor-data-provider";
import { EditorHeader } from "@/components/editor/editor-header";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { ErrorMessage } from "@/components/ui/error-message";
import { MAX_MEDIA_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import type { PostEditorValues } from "@/lib/validations/post";
import "@/styles/editor.css";
import {
  type Editor,
  EditorContext,
  EditorOutline,
  EditorScrollArea,
  ImageUpload,
  type MediaPage,
  type UseMarbleEditorOptions,
  useMarbleEditor,
  VideoUpload,
} from "@marble/editor";
import { SidebarInset, useSidebar } from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getMediaEditorApiUrl } from "@/lib/search-params";
import type { MediaCursorListResponse } from "@/types/media";
import { generateSlug } from "@/utils/string";
import { TextareaAutosize } from "./textarea-autosize";

/**
 * How often, at most, editor content is serialised into the form while
 * typing. Serialising means `getHTML()` + `getJSON()` + a JSON string and a
 * form validation pass, which adds up on long posts if done per keystroke.
 */
const CONTENT_SYNC_INTERVAL = 300;

// Module level so the editor options keep the same identity across renders;
// `useEditor` pushes changed options into the editor on every render.
const EDITOR_PROPS: UseMarbleEditorOptions["editorProps"] = {
  attributes: {
    // Headings: prose defaults to weights of 800/700/600 and an H1 as big as
    // the post title. Match the title's semibold and step the sizes down
    // from it (title 36px, H1 30px, H2 24px, H3 20px), like Notion.
    class:
      "prose dark:prose-invert min-h-96 h-full sm:px-4 focus:outline-hidden max-w-full prose-blockquote:border-border prose-figcaption:not-italic prose-headings:font-semibold prose-h1:text-[1.875em] prose-h2:text-[1.5em] prose-h3:text-[1.25em]",
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
};

function EditorPageContent() {
  "use no memo";
  const params = useParams<{ workspace: string }>();
  const { open, isMobile } = useSidebar();
  const { mode, postId, registerBeforeSubmit } = useEditorData();
  const {
    clearErrors,
    formState: { errors },
    getFieldState,
    getValues,
    register,
    setValue,
  } = useFormContext<PostEditorValues>();

  // The editor owns the content once it exists; the form value is only its
  // starting point. Watching it would re-render this whole page (sidebar
  // included) on every keystroke.
  const [initialContent] = useState(() => getValues("content") || "");

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
        const url = getMediaEditorApiUrl("/api/media/editor", {
          cursor: cursor || null,
        });
        const response = await fetch(url);
        if (!response.ok) {
          return { media: [] };
        }
        const data: MediaCursorListResponse = await response.json();
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

  const writeContent = useCallback(
    (editor: Editor) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      if (html.length > 0 && getFieldState("content").invalid) {
        clearErrors("content");
      }
      setValue("content", html, { shouldDirty: true, shouldValidate: true });
      setValue("contentJson", JSON.stringify(json), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [clearErrors, getFieldState, setValue]
  );

  // Throttled sync of editor content into the form: the first change is
  // written straight away (so the post turns dirty immediately), later ones
  // at most every CONTENT_SYNC_INTERVAL, and the last one always lands.
  const pendingEditorRef = useRef<Editor | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const flushContent = useCallback(() => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    const pendingEditor = pendingEditorRef.current;
    pendingEditorRef.current = null;

    if (pendingEditor && !pendingEditor.isDestroyed) {
      writeContent(pendingEditor);
    }
  }, [writeContent]);

  const scheduleContentSync = useCallback(() => {
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;

      if (pendingEditorRef.current) {
        flushContent();
        scheduleContentSync();
      }
    }, CONTENT_SYNC_INTERVAL);
  }, [flushContent]);

  const handleEditorUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      pendingEditorRef.current = editor;

      if (syncTimerRef.current === null) {
        flushContent();
        scheduleContentSync();
      }
    },
    [flushContent, scheduleContentSync]
  );

  // Saving must see the latest content, not the last throttled write
  useEffect(
    () => registerBeforeSubmit(flushContent),
    [flushContent, registerBeforeSubmit]
  );

  useEffect(
    () => () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    },
    []
  );

  const extensions = useMemo(
    () => [
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
    [fetchMediaPage, handleImageUpload, handleUploadError, handleVideoUpload]
  );

  const editor = useMarbleEditor({
    content: initialContent,
    placeholder: "Start typing or press '/' for commands",
    editorProps: EDITOR_PROPS,
    extensions,
    onUpdate: handleEditorUpdate,
  });
  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <SidebarInset className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-editor-content-background shadow-xs">
        <EditorHeader postId={postId} workspace={params.workspace} />
        {/*
          The whole pane below the header scrolls, right to its bottom edge,
          so the wheel, the block handle and drops work in the margins too.
          The side padding keeps room for the block handle beside the column.
        */}
        <EditorScrollArea className="scrollbar-hide min-h-0 flex-1 px-4 sm:px-10">
          {/* relative: the block handle, drop cursor and menus are positioned
              against the column, so they scroll with the content */}
          <form
            className="relative mx-auto w-full max-w-3xl space-y-5 p-4 pb-24"
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
                {...register("title", {
                  onChange: (e) => {
                    if (mode === "create") {
                      setValue("slug", generateSlug(e.target.value), {
                        shouldDirty: true,
                      });
                      clearErrors("slug");
                    }
                  },
                })}
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
        </EditorScrollArea>
        {/* Section jump rail, over the right gutter below the header */}
        <EditorOutline className="absolute top-14 right-0 bottom-0 hidden sm:flex" />
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
