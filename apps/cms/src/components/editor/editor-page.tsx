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
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CharacterCount,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  type JSONContent,
} from "novel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { HiddenScrollbar } from "@/components/editor/hidden-scrollbar";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { generateSlug } from "@/utils/string";
import { BubbleMenu } from "./bubble-menu";
import { defaultExtensions } from "./extensions";
import { uploadFn } from "./image-upload";
import { ShareModal } from "./share-modal";
import { slashCommand } from "./slash-command-items";
import { SlashCommandMenu } from "./slash-command-menu";
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
  const editorRef = useRef<EditorInstance | null>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(
    null
  );
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

  useEffect(() => {
    const subscription = watch((currentValues) => {
      const initial = initialDataRef.current;
      // Ensure all relevant fields are stringified for comparison
      const hasChanged =
        JSON.stringify({
          ...currentValues,
          contentJson: currentValues.contentJson
            ? JSON.parse(currentValues.contentJson)
            : {},
        }) !==
        JSON.stringify({
          ...initial,
          contentJson: initial.contentJson
            ? JSON.parse(initial.contentJson)
            : {},
        });
      if (hasChanged) {
        setHasUnsavedChanges(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setHasUnsavedChanges]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editorRef.current?.commands.focus();
    }
  };

  const handleEditorChange = (html: string, json: JSONContent) => {
    if (html.length > 0) {
      clearErrors("content");
    }
    setValue("content", html);
    setValue("contentJson", JSON.stringify(json));
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

  return (
    <EditorRoot>
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
                <EditorContent
                  editorProps={{
                    handleDOMEvents: {
                      keydown: (_view, event) => handleCommandNavigation(event),
                    },
                    handlePaste: (view, event) =>
                      handleImagePaste(view, event, uploadFn),
                    handleDrop: (view, event, _slice, moved) =>
                      handleImageDrop(view, event, moved, uploadFn),
                    attributes: {
                      class:
                        "prose dark:prose-invert min-h-96 h-full sm:px-4 focus:outline-hidden max-w-full prose-blockquote:border-border",
                    },
                  }}
                  extensions={[
                    ...defaultExtensions,
                    slashCommand,
                    CharacterCount,
                  ]}
                  immediatelyRender={false}
                  initialContent={JSON.parse(watch("contentJson") || "{}")}
                  onCreate={({ editor }) => {
                    editorRef.current = editor;
                    setEditorInstance(editor);
                  }}
                  onUpdate={({ editor }) => {
                    editorRef.current = editor;
                    setEditorInstance(editor);
                    const html = editor.getHTML();
                    const json = editor.getJSON();
                    handleEditorChange(html, json);
                  }}
                >
                  <BubbleMenu />
                  <SlashCommandMenu />
                </EditorContent>
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
        editor={editorInstance}
        errors={errors}
        formRef={formRef}
        isOpen={showSettings}
        isSubmitting={isCreating || isUpdating}
        mode={isUpdateMode ? "update" : "create"}
        setIsOpen={setShowSettings}
        watch={watch}
      />
    </EditorRoot>
  );
}
export default EditorPage;
