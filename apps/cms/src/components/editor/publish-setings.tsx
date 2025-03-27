"use client";

import { uploadImageAction } from "@/lib/actions/upload";
import type { PostValues } from "@/lib/validations/post";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { ScrollArea, ScrollBar } from "@marble/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import {
  CalendarDays,
  CheckIcon,
  CloudUpload,
  ImageIcon,
  InfoIcon,
  Loader2,
  PlusIcon,
  SettingsIcon,
  Trash2,
} from "@marble/ui/lib/icons";

import { useSession } from "@/lib/auth/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { Separator } from "@marble/ui/components/separator";
import { Switch } from "@marble/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { useWorkspace } from "../../context/workspace";
import { CreateCategoryModal } from "../categories/category-modals";
import { AuthorSelector } from "./author-selector";
import { TagSelector } from "./tag-selector";
// URL schema
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
  mode?: "create" | "update";
}

interface TagAndCategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface MediaResponse {
  id: string;
  name: string;
  url: string;
}

interface AuthorResponse {
  id: string;
  name: string;
  image: string;
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
  mode = "create",
}: PublishSettingsProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const {
    status,
    category,
    attribution,
    tags,
    coverImage,
    authors: initialAuthors,
  } = watch();
  const [date, setDate] = useState<Date | undefined>(
    watch("publishedAt") ? new Date(watch("publishedAt")) : new Date(),
  );
  const [showCategoyModal, setShowCategoryModal] = useState(false);
  const [file, setFile] = useState<File | undefined>();
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [optimisticCategories, setOptimisticCategories] = useState<
    TagAndCategoryResponse[]
  >([]);
  const [optimisticTags, setOptimisticTags] = useState<
    TagAndCategoryResponse[]
  >([]);
  const [showAttribution, setShowAttribution] = useState(!!attribution);
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();

  // Fetch tags
  useQuery({
    queryKey: ["tags"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const tags: TagAndCategoryResponse[] = await res.json();
      setOptimisticTags(tags);
      return tags;
    },
  });

  // Fetch categories
  useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const categories: TagAndCategoryResponse[] = await res.json();
      setOptimisticCategories(categories);
      return categories;
    },
  });

  // Fetch media
  const { data: media } = useQuery({
    queryKey: ["media"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/media");
      const data: MediaResponse[] = await res.json();
      return data;
    },
  });

  const { data: authors } = useQuery({
    queryKey: ["authors"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/authors");
      const data: AuthorResponse[] = await res.json();
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

  const handleCompressAndUpload = async (file: File) => {
    try {
      setIsUploading(true);
      toast.loading("Compressing...", {
        id: "uploading",
        position: "top-center",
      });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const compressedBlob = await response.blob();
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, ".webp"),
        {
          type: "image/webp",
        },
      );

      toast.loading("Uploading...", {
        id: "uploading",
        position: "top-center",
      });

      // Upload to Cloudflare R2
      const result = await uploadImageAction(compressedFile);

      // Set the cover image URL
      setValue("coverImage", result.url);

      // Handle successful upload
      setIsUploading(false);
      toast.success("Uploaded successfully!", {
        id: "uploading",
        position: "top-center",
      });

      setFile(undefined);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
        {
          id: "uploading",
          position: "top-center",
        },
      );
      setIsUploading(false);
    }
  };

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

  // Update the form value when date changes
  useEffect(() => {
    if (date) {
      setValue("publishedAt", date);
    }
  }, [date, setValue]);

  const handleUpdateCategoryList = async (data: TagAndCategoryResponse) => {
    setOptimisticCategories([...optimisticCategories, data]);
  };

  const handleUpdateTagList = (data: TagAndCategoryResponse) => {
    setOptimisticTags([...optimisticTags, data]);
  };

  const renderCoverImage = () => {
    if (coverImage) {
      return (
        <div className="relative w-full h-48">
          <img
            src={coverImage}
            alt="cover"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={() => setValue("coverImage", null)}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full hover:text-destructive"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">remove image</span>
          </button>
        </div>
      );
    }

    return (
      <Tabs defaultValue="upload" className="w-full">
        <TabsList variant="underline" className="flex justify-start mb-4">
          <TabsTrigger variant="underline" value="upload">
            Upload
          </TabsTrigger>
          <TabsTrigger variant="underline" value="embed">
            Embed
          </TabsTrigger>
          <TabsTrigger variant="underline" value="media">
            Media
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-48">
                <img
                  src={URL.createObjectURL(file)}
                  alt="cover preview"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Button
                  variant="destructive"
                  onClick={() => setFile(undefined)}
                  disabled={isUploading}
                >
                  <Trash2 className="size-4" />
                  <span>Remove</span>
                </Button>
                <Button
                  disabled={isUploading}
                  onClick={() => file && handleCompressAndUpload(file)}
                >
                  {isUploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CloudUpload className="size-4" />
                  )}
                  <span>Upload</span>
                </Button>
              </div>
            </div>
          ) : (
            <Label
              htmlFor="image"
              className="w-full h-48 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:border-primary"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-4" />
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium">Upload Image</p>
                  <p className="text-xs font-medium">(Max 4mb)</p>
                </div>
              </div>
              <Input
                onChange={(e) => setFile(e.target.files?.[0])}
                id="image"
                type="file"
                accept="image/*"
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
            {urlError && <p className="text-sm text-destructive">{urlError}</p>}
          </div>
        </TabsContent>
        <TabsContent value="media">
          <ScrollArea className="w-[364px] whitespace-nowrap border">
            <div className="flex p-4 gap-4">
              {media && media.length > 0 ? (
                media.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setValue("coverImage", item.url)}
                    className="flex-none group relative"
                  >
                    <div className="w-32 h-26 rounded-md overflow-hidden border">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[128px]">
                      {item.name}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 w-full">
                  <p className="text-muted-foreground text-sm">
                    No media found. Upload some images first.
                  </p>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  };

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
            <SheetDescription className="sr-only">
              Setup article metadata.
            </SheetDescription>
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
                        Whether your post is published or saved as a draft.
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

              {renderCoverImage()}
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
                        post, recommended to be all lowercase and no special
                        characters.
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

            <AuthorSelector
              options={authors || []}
              control={control}
              defaultAuthors={initialAuthors || []}
              primaryAuthor={{
                id: session?.user.id as string,
                name: session?.user.name as string,
                image: session?.user.image as string,
              }}
            />

            <TagSelector
              options={optimisticTags}
              control={control}
              defaultTags={tags || []}
              onTagCreated={handleUpdateTagList}
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
                        {optimisticCategories.length === 0
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
                    {optimisticCategories.map((category) => (
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

            <Separator orientation="horizontal" className="flex mt-4" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label htmlFor="attribution">Add Attribution</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="size-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground text-xs max-w-64">
                          Use this when republishing content from elsewhere to
                          give credit to the original author. This helps
                          maintain ethical content practices and avoid
                          plagiarism concerns.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="attribution"
                  checked={showAttribution}
                  onCheckedChange={(checked) => {
                    setShowAttribution(checked);
                    if (!checked) {
                      setValue("attribution", null);
                    }
                  }}
                />
              </div>

              {showAttribution && (
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Input
                      placeholder="Original author's name"
                      onChange={(e) => {
                        setValue("attribution", {
                          author: e.target.value,
                          url: attribution?.url || "",
                        });
                      }}
                      value={attribution?.author || ""}
                    />
                    {errors.attribution?.author && (
                      <p className="text-sm text-destructive px-1">
                        {errors.attribution.author.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Link to original post"
                      onChange={(e) => {
                        setValue("attribution", {
                          author: attribution?.author || "",
                          url: e.target.value,
                        });
                      }}
                      value={attribution?.url || ""}
                    />
                    {errors.attribution?.url && (
                      <p className="text-sm text-destructive px-1">
                        {errors.attribution.url.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
          <SheetFooter>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={triggerSubmit}
              className="mt-4 min-w-32"
            >
              {isSubmitting && status === "published" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : status === "published" ? (
                mode === "create" ? (
                  "Save & Publish"
                ) : (
                  "Save & Update"
                )
              ) : (
                "Save as Draft"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CreateCategoryModal
        open={showCategoyModal}
        setOpen={setShowCategoryModal}
        onCategoryCreated={handleUpdateCategoryList}
      />
    </>
  );
}
