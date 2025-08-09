"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { ArrowElbowUpLeft, SidebarSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Editor } from "@/components/editor/editor";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { HiddenScrollbar } from "@/components/editor/hidden-scrollbar";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { sanitizeHtml } from "@/utils/editor";
import { generateSlug } from "@/utils/string";

interface EditorPageProps {
  initialData: PostValues;
  id?: string;
}

function EditorPage({ initialData, id }: EditorPageProps) {
  const router = useRouter();
  const params = useParams<{ workspace: string }>();
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
      queryClient.invalidateQueries({
        queryKey: ["posts", params.workspace],
      });
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["posts", params.workspace],
        }),
        queryClient.invalidateQueries({ queryKey: ["post", id] }),
      ]);
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
      setHasUnsavedChanges(hasChanged);
    });

    return () => subscription.unsubscribe();
  }, [watch, setHasUnsavedChanges]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // TODO: focus the editor when user hits enter
    }
  };

  const handleEditorChange = (html: string, json: JSONContent) => {
    if (html.length > 0) {
      clearErrors("content");
    }
    setValue("content", sanitizeHtml(html));
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

  useEffect(() => {
    if (title && !isUpdateMode) {
      const slug = generateSlug(title);
      setValue("slug", slug);
      clearErrors("slug");
    } else if (
      title &&
      isUpdateMode &&
      initialDataRef.current &&
      initialDataRef.current.title !== title
    ) {
      const slug = generateSlug(title);
      setValue("slug", slug);
      clearErrors("slug");
    }
  }, [title, setValue, clearErrors, isUpdateMode]);

  return (
    <>
      <SidebarInset className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] rounded-xl border bg-sidebar/70 shadow-sm">
        <header className="sticky top-0 z-50 flex justify-between p-3">
          <div className="flex items-center gap-4">
            <Link
              className={cn(buttonVariants({ variant: "ghost" }), "group")}
              href={`/${params.workspace}/posts`}
            >
              <ArrowElbowUpLeft
                className="size-6 text-muted-foreground group-hover:text-foreground"
                weight="regular"
              />
            </Link>
          </div>

          <div>
            <SidebarTrigger
              className="size-10 text-muted-foreground"
              size="icon"
            >
              <SidebarSimple />
            </SidebarTrigger>
          </div>
        </header>
        <section className="mx-auto w-full max-w-3xl flex-1">
          <HiddenScrollbar className="h-[calc(100vh-8rem)]">
            <form
              className="space-y-5 rounded-md p-4"
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
            >
              <div className="flex flex-col">
                <label className="sr-only" htmlFor="title">
                  Enter post your title
                </label>
                <textarea
                  id="title"
                  placeholder="Title"
                  {...register("title")}
                  className="scrollbar-hide min-h-20 w-full resize-none bg-transparent font-semibold text-4xl focus:outline-none focus:ring-0 sm:px-4"
                  onKeyDown={handleKeyDown}
                />
                {errors.title && (
                  <p className="px-1 font-medium text-destructive text-sm">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <Editor
                  onChange={handleEditorChange}
                  value={JSON.parse(watch("contentJson") || "{}")}
                />
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
        setIsOpen={setShowSettings}
        watch={watch}
      />
    </>
  );
}
export default EditorPage;
