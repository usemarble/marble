"use client";

import "@/styles/editor.css";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditorContext,
  ImageUpload,
  type JSONContent,
  type MediaItem,
  useMarbleEditor,
} from "@marble/editor";
import { SidebarInset, useSidebar } from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { MarbleEditorMenus } from "@/components/editor/editor";
import { EditorHeader } from "@/components/editor/editor-header";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { HiddenScrollbar } from "@/components/ui/hidden-scrollbar";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MAX_MEDIA_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import type { MediaListResponse } from "@/types/media";
import { generateSlug } from "@/utils/string";
import { TextareaAutosize } from "./textarea-autosize";

type EditorPageProps = {
  initialData: PostValues;
  id?: string;
};

function EditorPage({ initialData, id }: EditorPageProps) {
  const router = useRouter();
  const params = useParams<{ workspace: string }>();
  const workspaceId = useWorkspaceId();
  const { open, isMobile } = useSidebar();
  const formRef = useRef<HTMLFormElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const initialDataRef = useRef<PostValues>(initialData);
  const queryClient = useQueryClient();
  const isUpdateMode = !!id;

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { ...initialData },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = form;

  const { mutate: createPost, isPending: isCreating } = useMutation({
    mutationFn: (values: PostValues) =>
      fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify(values),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create post");
        }
        return await res.json();
      }),
    onSuccess: (data) => {
      toast.success("Post created");
      router.push(`/${params.workspace}/editor/p/${data.id}`);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POSTS(workspaceId),
        });
      }
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updatePost, isPending: isUpdating } = useMutation({
    mutationFn: (values: PostValues) =>
      fetch(`/api/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update post");
        }
        return res;
      }),
    onSuccess: async (_data, variables) => {
      toast.success("Post updated");
      if (workspaceId && id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.POSTS(workspaceId),
          }),
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.POST(workspaceId, id),
          }),
        ]);
      }
      form.reset({ ...variables });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    // Reset form if initialData changes (e.g., navigating between posts or from new to edit)
    form.reset({ ...initialData });
    initialDataRef.current = initialData;
  }, [initialData, form.reset]);

  useEffect(() => {
    const subscription = watch((currentValues) => {
      const initial = initialDataRef.current;
      // Compare HTML content directly instead of parsing JSON
      const hasChanged =
        currentValues.content !== initial.content ||
        currentValues.title !== initial.title ||
        currentValues.slug !== initial.slug ||
        currentValues.description !== initial.description ||
        currentValues.category !== initial.category ||
        currentValues.status !== initial.status ||
        currentValues.featured !== initial.featured ||
        JSON.stringify(currentValues.tags) !== JSON.stringify(initial.tags) ||
        JSON.stringify(currentValues.authors) !==
          JSON.stringify(initial.authors) ||
        currentValues.coverImage !== initial.coverImage ||
        JSON.stringify(currentValues.attribution) !==
          JSON.stringify(initial.attribution);
      if (hasChanged) {
        setHasUnsavedChanges(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setHasUnsavedChanges]);

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
      setValue("content", html);
      setValue("contentJson", JSON.stringify(json));
    },
    [clearErrors, setValue]
  );

  function onSubmit(values: PostValues) {
    if (isUpdateMode && id) {
      updatePost(values);
    } else {
      createPost(values);
    }
  }

  const title = watch("title");
  const debouncedTitle = useDebounce(title || "", 300);

  useEffect(() => {
    if (debouncedTitle && !isUpdateMode) {
      const slug = generateSlug(debouncedTitle);
      setValue("slug", slug);
      clearErrors("slug");
    }
  }, [debouncedTitle, setValue, clearErrors, isUpdateMode]);

  const editor = useMarbleEditor({
    content: initialData.content || "",
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
    onUpdate: handleEditorUpdate,
  });
  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <SidebarInset className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] rounded-xl border bg-editor-content-background shadow-xs">
        <EditorHeader postId={id} workspace={params.workspace} />
        <section className="mx-auto w-full max-w-3xl flex-1">
          <HiddenScrollbar className="h-[calc(100vh-7rem)]">
            <form
              className="space-y-5 rounded-md p-4"
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
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
                  <p className="px-1 font-medium text-destructive text-sm">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <MarbleEditorMenus />

                {errors.content && (
                  <p className="px-1 font-medium text-destructive text-sm">
                    {errors.content.message}
                  </p>
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
      <EditorSidebar
        control={control}
        errors={errors}
        formRef={formRef}
        isOpen={showSettings}
        isSubmitting={isCreating || isUpdating}
        mode={isUpdateMode ? "update" : "create"}
        postId={id}
        setIsOpen={setShowSettings}
        watch={watch}
      />
    </EditorContext.Provider>
  );
}
export default EditorPage;
