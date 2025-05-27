"use client";

import Editor from "@/components/editor/editor";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { updatePostAction } from "@/lib/actions/post";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { sanitizeHtml } from "@/utils/editor";
import { generateSlug } from "@/utils/string";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Separator } from "@marble/ui/components/separator";
import { ScrollArea, ScrollBar } from "@marble/ui/components/scroll-area";
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

interface PageClientProps {
  data: PostValues;
  id: string;
}

function PageClient({ data, id }: PageClientProps) {
  const [saving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();
  const { open, isMobile } = useSidebar();

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { ...data },
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    // TODO: focus the editor when user hits enter
  };

  const handleEditorChange = (html: string, json: JSONContent) => {
    if (html.length > 0) {
      clearErrors("content");
    }
    setValue("content", sanitizeHtml(html));
    setValue("contentJson", JSON.stringify(json));
  };

  async function onSubmit(values: PostValues) {
    // console.log(values);
    try {
      await updatePostAction(values, id);
      toast.success("Post updated");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setShowSettings(false);
    }
  }

  const title = watch("title");

  useEffect(() => {
    if (title) {
      const slug = generateSlug(title);
      setValue("slug", slug);
      clearErrors("slug");
    }
  }, [title, setValue, clearErrors]);

  return (
    <>
      <SidebarInset className="bg-sidebar rounded-xl shadow-sm border min-h-[calc(100vh-1rem)] h-[calc(100vh-1rem)]">
        <header className="sticky top-0 px-4 py-2 z-50 flex justify-between">
          <div className="flex gap-4 items-center">
            <Button
              disabled={saving}
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="group"
            >
              <CornerUpLeft className="size-4 text-muted-foreground group-hover:text-foreground" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <SidebarTrigger size="icon" className="size-10" />
          </div>
        </header>
        <section className="mx-auto w-full max-w-3xl ">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 rounded-md px-4 pt-7 pb-10"
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
                  value={JSON.parse(watch("contentJson"))}
                  onChange={handleEditorChange}
                />
                {errors.content && (
                  <p className="text-sm px-1 font-medium text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </form>
            <ScrollBar />
          </ScrollArea>
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
      />
    </>
  );
}

export default PageClient;
