"use client";

import Editor from "@/components/editor/editor";
import { PublishSettings } from "@/components/editor/publish-setings";
import { type PostValues, postSchema } from "@/lib/validations/post";
import { generateSlug } from "@/utils/generate-slug";
import { sanitizeHtml } from "@/utils/sanitize-html";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { Undo } from "@repo/ui/lib/icons";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { JSONContent } from "novel";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { publishArticle } from "./actions";

function PageContent() {
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const session = useSession();
  // NOT exactly working just placeholder for now I guess
  // Trying to indicate users connection status

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { coverImage: null, contentJson: "{}" },
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
    console.log(json);
  };

  async function onSubmit(values: PostValues) {
    try {
      await publishArticle(values);
    } catch {
      toast.error("Something went wrong, please try again.", {
        style: {
          border: "1px solid hsl(354 84% 57%)",
        },
      });
    }
  }

  const title = watch("title");

  useEffect(() => {
    if (title) {
      const slug = generateSlug(title);
      setValue("slug", slug);
    }
  }, [title, setValue]);

  return (
    <>
      <div className="">
        <header className="bg-background/90 sticky top-0 px-4 py-2 backdrop-blur-lg border-b z-50 flex justify-between">
          <div className="flex gap-4 items-center">
            <Button asChild disabled={saving} variant="ghost" size="sm">
              <Link href="/" className="flex items-center gap-2 text-xs">
                <Undo className="size-4 text-muted-foreground ml-2" />
                <span>Dashboard</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${session ? "bg-green-400" : "bg-yellow-400"} opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full size-2 ${session ? "bg-green-500" : "bg-yellow-500"} `}
              />
            </span>
            <p className="text-xs">{session ? "Connected" : "Connecting..."}</p>
          </div>
          <div className="flex gap-4 justify-end items-center">
            <div className="flex flex-col text-xs text-right text-muted-foreground">
              <p>251 words</p>
              <p>2453 characters</p>
            </div>
            <PublishSettings
              errors={errors}
              control={control}
              trigger={trigger}
              formRef={formRef}
              register={register}
              setValue={setValue}
              isSubmitting={isSubmitting}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl py-6">
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 rounded-md px-4 py-10"
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
                className="h-20 w-full bg-transparent sm:px-4 text-4xl font-bold focus:outline-none focus:ring-0"
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

export default PageContent;
