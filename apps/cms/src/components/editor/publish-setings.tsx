"use client";

import type { PostValues } from "@/lib/validations/post";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import {
  CalendarDays,
  CheckIcon,
  ImageIcon,
  InfoIcon,
  Loader2,
  PlusIcon,
  Save,
  SettingsIcon,
  Trash2,
} from "@repo/ui/lib/icons";

import { useUploadThing } from "@/utils/uploadthing";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import { Switch } from "@repo/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { s } from "node_modules/better-auth/dist/index-DwXoFQKD";
import { useEffect, useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { CreateCategoryModal } from "../categories/category-modals";
import { TagSelector } from "./tag-selector";

// Add URL schema
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

interface PublishSettingsProps {
  control: Control<PostValues>;
  register: UseFormRegister<PostValues>;
  setValue: UseFormSetValue<PostValues>;
  clearErrors: UseFormClearErrors<PostValues>;
  errors: FieldErrors<PostValues>;
  trigger: UseFormTrigger<PostValues>;
  watch: UseFormWatch<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
  isSubmitting: boolean;
  defaultCoverImage?: string | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface TagResponse {
  id: string;
  name: string;
  slug: string;
}

export function PublishSettings({
  control,
  register,
  setValue,
  errors,
  formRef,
  isSubmitting,
  watch,
  isOpen,
  setIsOpen,
  clearErrors,
}: PublishSettingsProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showCategoyModal, setShowCategoryModal] = useState(false);
  const { status, category } = watch();
  const [file, setFile] = useState<File | undefined>();
  const { coverImage } = watch();
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Fetch tags
  const { data } = useQuery({
    queryKey: ["tags"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const data: TagResponse[] = await res.json();
      return data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data: TagResponse[] = await res.json();
      return data;
    },
  });

  // Trigger form submit
  const triggerSubmit = async () => {
    if (hasErrors) {
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  // Upload cover image
  const { startUpload } = useUploadThing("posts", {
    onClientUploadComplete: (res) => {
      const imageUrl = res[0]?.url;
      if (imageUrl) {
        setValue("coverImage", imageUrl);
      }
      toast.success("uploaded successfully!", {
        id: "uploading",
        position: "top-center",
      });
      setIsOpen(false);
    },
    onUploadError: () => {
      toast.error("Failed to upload", {
        id: "uploading",
        position: "top-center",
      });
    },
    onUploadBegin: (filename) => {
      console.log("upload has begun for", filename);
      toast.loading("uploading...", {
        id: "uploading",
        position: "top-center",
      });
    },
  });

  const handleEmbed = async (url: string) => {
    if (!url) return;

    setIsValidatingUrl(true);
    setUrlError(null);

    try {
      await urlSchema.parseAsync(url);
      const img = new Image();
      img.onload = () => {
        setValue("coverImage", url);
        setEmbedUrl("");
        setIsValidatingUrl(false);
      };
      img.onerror = () => {
        setUrlError("Invalid image URL");
        setIsValidatingUrl(false);
      };
      img.src = url;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUrlError(error.errors?.[0]?.message || "Invalid URL");
      } else {
        setUrlError("Invalid URL");
      }
      setIsValidatingUrl(false);
    }
  };

  // Start upload when file is selected
  useEffect(() => {
    if (file) {
      startUpload([file]);
    }
  }, [file, startUpload]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="group">
            <SettingsIcon className="size-4 text-muted-foreground group-hover:text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent className="h-[97%] right-3 top-3 border rounded-md overflow-y-auto min-w-[420px]">
          <SheetHeader>
            <SheetTitle>Publish settings</SheetTitle>
            <SheetDescription>Setup article metadata.</SheetDescription>
          </SheetHeader>
          <section className="grid gap-6 py-6">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1">
                <Label htmlFor="status">Published</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        Whether your post is published or not
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="status"
                checked={status === "published"}
                onCheckedChange={() =>
                  setValue(
                    "status",
                    status === "published" ? "unpublished" : "published",
                  )
                }
              />
            </div>

            <Separator orientation="horizontal" className=" flex" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium leading-none">Cover Image</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        A featured image usually used for the post thumbnail and
                        social media previews (optional)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Image Preview */}
              {coverImage && (
                <div className="relative w-full h-48 mb-4">
                  <img
                    alt="cover"
                    src={coverImage}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setValue("coverImage", null)}
                    className="bg-white hover:text-destructive rounded-full p-1.5 absolute top-2 right-2"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">remove image</span>
                  </button>
                </div>
              )}
              {!coverImage && (
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList
                    variant="underline"
                    className="flex justify-start mb-4"
                  >
                    <TabsTrigger variant="underline" value="upload">
                      Upload
                    </TabsTrigger>
                    <TabsTrigger variant="underline" value="embed">
                      Embed
                    </TabsTrigger>
                  </TabsList>
                  {/*  */}
                  <TabsContent value="upload">
                    {file ? (
                      <div className="relative w-full h-44">
                        <img
                          alt="cover"
                          src={URL.createObjectURL(file)}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFile(undefined)}
                          className="bg-white hover:text-destructive rounded-full p-1.5 absolute top-2 right-2"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">remove image</span>
                        </button>
                      </div>
                    ) : (
                      <Label
                        htmlFor="coverImage"
                        className="w-full h-44 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:border-primary"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="size-4" />
                          <p className="text-sm font-medium">Upload Image</p>
                        </div>
                        <Input
                          type="file"
                          id="coverImage"
                          onChange={(e) => setFile(e.target.files?.[0])}
                          className="sr-only"
                        />
                      </Label>
                    )}
                  </TabsContent>
                  <TabsContent value="embed">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={embedUrl}
                          onChange={({ target }) => {
                            setEmbedUrl(target.value);
                            setUrlError(null);
                          }}
                          placeholder="Paste your cover image link"
                          className={cn(urlError && "border-destructive")}
                        />
                        <Button
                          className="shrink-0"
                          size="icon"
                          onClick={() => handleEmbed(embedUrl)}
                          disabled={isValidatingUrl || !embedUrl}
                        >
                          {isValidatingUrl ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckIcon className="size-4" />
                          )}
                        </Button>
                      </div>
                      {urlError && (
                        <p className="text-sm text-destructive">{urlError}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="description">Description</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        A short description of your post recommended to be 155
                        characters or less
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Textarea
                id="description"
                {...register("description")}
                placeholder="A short description of your post"
                className="col-span-3"
              />
              {errors.description && (
                <p className="text-sm px-1 font-medium text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="slug">Slug</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        A url friendly string that can be used to access your
                        post, recommended to be all lowercase.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="my-awesome-post"
                className="col-span-3"
              />
              {errors.slug && (
                <p className="text-sm px-1 font-medium text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <TagSelector
              options={data || []}
              control={control}
              defaultTags={watch("tags")}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="category">Category</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        Good for grouping posts together. You can have one
                        category per post.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={category}
                onValueChange={(value) => {
                  setValue("category", value);
                  clearErrors("category");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="font-normal px-2 text-xs flex items-center gap-1 justify-between">
                      <span className="text-muted-foreground text-xs">
                        {categories?.length === 0
                          ? "No categories"
                          : "Categories"}
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1 p-1 hover:bg-accent"
                        onClick={() => setShowCategoryModal(true)}
                      >
                        <PlusIcon className="size-4 text-muted-foreground" />
                        <span className="sr-only">Add New Category</span>
                      </button>
                    </SelectLabel>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm px-1 font-medium text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="publishedAt">Published On</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="size-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-muted-foreground text-xs max-w-64">
                        The date your post was published. This is set by default
                        but you can change it to any date.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-between text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarDays className="text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </section>
          <SheetFooter>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={triggerSubmit}
              className="mt-4"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CreateCategoryModal
        open={showCategoyModal}
        setOpen={setShowCategoryModal}
      />
    </>
  );
}
