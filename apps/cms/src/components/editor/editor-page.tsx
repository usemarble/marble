"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { SidebarSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { BubbleMenu } from "@/components/editor/bubble-menu";
import { DragHandle } from "@/components/editor/drag-handle";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import {
  TableColumnMenu,
  TableRowMenu,
} from "@/components/editor/extensions/table/menus";
import { HiddenScrollbar } from "@/components/editor/hidden-scrollbar";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { generateSlug } from "@/utils/string";
import { defaultExtensions } from "./extensions";
import { ShareModal } from "./share-modal";
import { TextareaAutosize } from "./textarea-autosize";

const getToggleSidebarShortcut = () => {
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0,
    []
  );
  return isMac ? "⌘K" : "Ctrl+K";
};

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
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create post");
        }
        return res.json();
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
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const { mutate: updatePost, isPending: isUpdating } = useMutation({
    mutationFn: (values: PostValues) =>
      fetch(`/api/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
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
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  useEffect(() => {
    // Reset form if initialData changes (e.g., navigating between posts or from new to edit)
    form.reset({ ...initialData });
    initialDataRef.current = initialData;
  }, [initialData, form.reset]);

  // Debounced form update to reduce React Hook Form rerenders
  const updateFormValues = useCallback(
    (html: string, json: JSONContent) => {
      if (html.length > 0) {
        clearErrors("content");
      }
      setValue("content", html);
      setValue("contentJson", JSON.stringify(json));
    },
    [setValue, clearErrors]
  );

  const debouncedUpdateFormValues = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (html: string, json: JSONContent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateFormValues(html, json);
      }, 150);
    };
  }, [updateFormValues]);

  // Create stable onUpdate callback ref to avoid recreating editor
  const onUpdateRef = useRef<
    ((html: string, json: JSONContent) => void) | null
  >(null);

  useEffect(() => {
    onUpdateRef.current = debouncedUpdateFormValues;
  }, [debouncedUpdateFormValues]);

  // Track content changes and idle callback for performance
  const contentChangedRef = useRef(false);
  const idleCallbackId = useRef<number | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: defaultExtensions,
    content: watch("content") || "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert min-h-96 h-full sm:px-4 focus:outline-hidden max-w-full prose-blockquote:border-border",
      },
    },
    onUpdate: ({ editor }) => {
      // CRITICAL OPTIMIZATION: Don't serialize on every keystroke!
      // Just mark that content changed and schedule serialization for idle time
      contentChangedRef.current = true;
      editorRef.current = editor;

      // Cancel previous idle callback if exists
      if (idleCallbackId.current !== null) {
        cancelIdleCallback(idleCallbackId.current);
      }

      // Schedule serialization when browser is idle
      idleCallbackId.current = requestIdleCallback(
        () => {
          if (contentChangedRef.current && editorRef.current) {
            const html = editorRef.current.getHTML();
            const json = editorRef.current.getJSON();
            onUpdateRef.current?.(html, json);
            contentChangedRef.current = false;
          }
        },
        { timeout: 100 }
      );
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  });

  // Cleanup idle callback on unmount
  useEffect(() => {
    return () => {
      if (idleCallbackId.current !== null) {
        cancelIdleCallback(idleCallbackId.current);
      }
    };
  }, []);

  // Debounce unsaved changes check to reduce overhead
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = watch((currentValues) => {
      // Debounce the check to avoid running on every keystroke
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const initial = initialDataRef.current;
        // Simple field comparison first (faster than JSON operations)
        const simpleFieldsChanged =
          currentValues.title !== initial.title ||
          currentValues.slug !== initial.slug ||
          currentValues.status !== initial.status ||
          currentValues.description !== initial.description;

        if (simpleFieldsChanged) {
          setHasUnsavedChanges(true);
          return;
        }

        // Only do expensive content comparison if simple fields haven't changed
        const contentChanged = currentValues.content !== initial.content;
        if (contentChanged) {
          setHasUnsavedChanges(true);
        }
      }, 300);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [watch, setHasUnsavedChanges]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editor?.commands.focus();
    }
  };

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

  // Create context value that updates when editor initializes
  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  // Memoize DragHandle to prevent plugin unregister/register cycles
  const dragHandle = useMemo(
    () => (editor ? <DragHandle editor={editor} /> : null),
    [editor]
  );

  return (
    <EditorContext.Provider value={editorContextValue}>
      <BubbleMenu />
      {editor && <TableRowMenu editor={editor} />}
      {editor && <TableColumnMenu editor={editor} />}
      {dragHandle}
      <SidebarInset className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] rounded-xl border bg-editor-content-background shadow-xs">
        <header className="sticky top-0 z-50 flex justify-between p-3">
          <div className="flex items-center gap-4">
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <Link
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "group cursor-default"
                  )}
                  href={`/${params.workspace}/posts`}
                >
                  <XIcon className="size-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close editor</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            {id && <ShareModal postId={id} />}
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <SidebarTrigger className="size-8 text-muted-foreground">
                  <SidebarSimpleIcon className="size-4" />
                </SidebarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle sidebar ({getToggleSidebarShortcut()})</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
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
                  onKeyDown={handleKeyDown}
                />
                {errors.title && (
                  <p className="px-1 font-medium text-destructive text-sm">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <EditorContent editor={editor} />
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
        editor={editor}
        errors={errors}
        formRef={formRef}
        isOpen={showSettings}
        isSubmitting={isCreating || isUpdating}
        mode={isUpdateMode ? "update" : "create"}
        setIsOpen={setShowSettings}
        watch={watch}
      />
    </EditorContext.Provider>
  );
}
export default EditorPage;
