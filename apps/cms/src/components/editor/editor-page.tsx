"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import { CornerUpLeft } from "@marble/ui/lib/icons";
import { cn } from "@marble/ui/lib/utils";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Editor from "@/components/editor/editor";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import HiddenScrollbar from "@/components/editor/hidden-scrollbar";
import { createPostAction, updatePostAction } from "@/lib/actions/post";
import { emptyPost } from "@/lib/data/post";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { sanitizeHtml } from "@/utils/editor";
import { generateSlug } from "@/utils/string";

interface EditorPageProps {
  initialData: PostValues;
  id?: string;
}

function EditorPage({ initialData = emptyPost, id }: EditorPageProps) {
  const router = useRouter();
  const { open, isMobile } = useSidebar();
  const formRef = useRef<HTMLFormElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const initialDataRef = useRef<PostValues>(initialData);

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
    trigger,
    control,
    formState: { isSubmitting, errors },
  } = form;

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  async function onSubmit(values: PostValues) {
    try {
      if (isUpdateMode && id) {
        await updatePostAction(values, id);
        toast.success("Post updated");
      } else {
        const res = await createPostAction(values);
        toast.success("Post created");
        router.push(`/editor/p/${res}`);
      }
      // Reset initial values to new saved state
      form.reset({ ...values });
      setHasUnsavedChanges(false);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setShowSettings(false);
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
      <SidebarInset className="bg-sidebar rounded-xl shadow-sm border min-h-[calc(100vh-1rem)] h-[calc(100vh-1rem)]">
        <header className="sticky top-0 p-3 z-50 flex justify-between">
          <div className="flex gap-4 items-center">
            <Button
              disabled={isSubmitting}
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="group"
            >
              <CornerUpLeft className="size-4 text-muted-foreground group-hover:text-foreground" />
            </Button>
          </div>

          <div>
            <SidebarTrigger
              size="icon"
              className="size-10 text-muted-foreground"
            />
          </div>
        </header>
        <section className="mx-auto w-full max-w-3xl flex-1">
          <HiddenScrollbar className="h-[calc(100vh-8rem)]">
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 rounded-md px-4 pt-7 pb-8"
            >
              <div className="flex flex-col">
                <label htmlFor="title" className="sr-only">
                  Enter post your title
                </label>
                <input
                  id="title"
                  placeholder="Title"
                  {...register("title")}
                  onKeyDown={handleKeyDown}
                  className="h-20 w-full bg-transparent sm:px-4 text-4xl font-semibold focus:outline-none focus:ring-0"
                />
                {errors.title && (
                  <p className="text-sm px-1 font-medium text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <Editor
                  value={JSON.parse(watch("contentJson") || "{}")}
                  onChange={handleEditorChange}
                />
                {errors.content && (
                  <p className="text-sm px-1 font-medium text-destructive">
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
            open ? "w-2" : "w-0",
          )}
        />
      )}
      <EditorSidebar
        errors={errors}
        control={control}
        trigger={trigger}
        formRef={formRef}
        register={register}
        setValue={setValue}
        clearErrors={clearErrors}
        watch={watch}
        isSubmitting={isSubmitting}
        isOpen={showSettings}
        setIsOpen={setShowSettings}
        mode={isUpdateMode ? "update" : "create"}
      />
    </>
  );
}

export default EditorPage;
