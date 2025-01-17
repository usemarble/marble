"use client";

import Editor from "@/components/editor/editor";
import { PublishSettings } from "@/components/editor/publish-setings";
import { updatePostAction } from "@/lib/actions/post";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { generateSlug } from "@/utils/generate-slug";
import { sanitizeHtml } from "@/utils/sanitize-html";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { CornerUpLeft } from "@repo/ui/lib/icons";
import { useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface PageClientProps {
  data: PostValues;
  id: string;
}

function PageClient({ data, id }: PageClientProps) {
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { ...data },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
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
    console.log(values);
    try {
      await updatePostAction(values, id);
      toast.success("Post updated", { position: "top-center" });
    } catch {
      toast.error("Something went wrong.", {
        position: "top-center",
      });
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
      <div>
        <header className="bg-background/90 sticky top-0 px-4 py-2 backdrop-blur-lg z-50 flex justify-between">
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

          <div className="flex gap-4 justify-end items-center">
            <PublishSettings
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
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl py-4">
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 rounded-md px-4 pt-6 pb-10"
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
        </main>
      </div>
    </>
  );
}

export default PageClient;
