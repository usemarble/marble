/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are unique within their respective modals */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import {
  CircleNotchIcon,
  ImageIcon,
  PlusIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  authorSchema,
  type CreateAuthorValues,
} from "@/lib/validations/authors";
import type { Author } from "@/types/author";
import { detectPlatform, getPlatformIcon } from "@/utils/author";
import { generateSlug } from "@/utils/string";
import { AsyncButton } from "../ui/async-button";
import { CopyButton } from "../ui/copy-button";

type AuthorSheetProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
  authorData?: Partial<Author>;
  onAuthorCreated?: (author: Author) => void;
};

export const AuthorSheet = ({
  open,
  setOpen,
  mode = "create",
  authorData = {
    name: "",
    slug: "",
    role: "",
    bio: "",
    email: "",
    image: null,
    userId: null,
    socials: [],
  },
  onAuthorCreated,
}: AuthorSheetProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateAuthorValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: authorData.name || "",
      slug: authorData.slug || "",
      role: authorData.role || "",
      bio: authorData.bio || "",
      email: authorData.email || "",
      image: authorData.image || null,
      userId: authorData.userId || null,
      socials:
        authorData.socials && authorData.socials.length > 0
          ? authorData.socials.map((social) => ({
              id: social.id,
              url: social.url,
              platform: social.platform,
            }))
          : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "socials",
    control,
  });

  const { name } = watch();
  const watchedSocials = watch("socials");
  const workspaceId = useWorkspaceId();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    authorData.image || null
  );
  const [file, setFile] = useState<File | null>(null);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadFile({ file, type: "author-avatar" }),
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      setValue("image", data.avatarUrl, { shouldDirty: true });
      setFile(null);
      toast.success("Avatar uploaded successfully");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    },
  });

  const { mutate: createAuthor, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateAuthorValues) => {
      try {
        const res = await fetch("/api/authors", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create author");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to create author"
        );
      }
    },
    onSuccess: (data) => {
      setOpen(false);
      toast.success("Author created successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTHORS(workspaceId),
        });
      }
      if (onAuthorCreated) {
        onAuthorCreated(data);
      }
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateAuthor, isPending: isUpdating } = useMutation({
    mutationFn: async (data: CreateAuthorValues) => {
      try {
        const res = await fetch(`/api/authors/${authorData.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update author");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update author"
        );
      }
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Author updated successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTHORS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (mode === "create") {
      setValue("slug", generateSlug(name));
    }
  }, [mode, name, setValue]);

  useEffect(() => {
    setAvatarUrl(authorData.image || null);
  }, [authorData.image]);

  const handleAvatarUpload = useCallback(() => {
    if (!file) {
      return;
    }
    uploadAvatar(file);
  }, [file, uploadAvatar]);

  useEffect(() => {
    if (file) {
      handleAvatarUpload();
    }
  }, [file, handleAvatarUpload]);

  const addSocialLink = () => {
    append({ url: "", platform: "website" });
  };

  const onSubmit = async (data: CreateAuthorValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    if (mode === "update" && !authorData.id) {
      toast.error("Author ID is missing - cannot update author");
      return;
    }

    const submissionData = {
      ...data,
      image: avatarUrl,
      socials: data.socials?.filter((social) => social.url.trim() !== "") || [],
    };

    if (mode === "create") {
      createAuthor(submissionData);
    } else {
      updateAuthor(submissionData);
    }
  };

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="font-medium text-xl">
            {mode === "create" ? "Create Author" : "Update Author"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {mode === "create"
              ? "Create a new author"
              : "Update the author's information"}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex h-full flex-col justify-between"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-5 grid flex-1 auto-rows-min gap-6 px-6">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Label
                    className={cn(
                      "group relative size-16 cursor-pointer overflow-hidden rounded-full",
                      isUploading && "pointer-events-none"
                    )}
                    htmlFor="avatar"
                  >
                    <Avatar className="size-16">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback>
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <input
                      accept="image/*"
                      className="sr-only"
                      id="avatar"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && !isUploading) {
                          setFile(file);
                          handleAvatarUpload();
                        }
                      }}
                      title="Upload avatar"
                      type="file"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex size-full items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-300",
                        isUploading
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isUploading ? (
                        <CircleNotchIcon className="size-4 animate-spin text-white" />
                      ) : (
                        <UploadSimpleIcon className="size-4 text-white" />
                      )}
                    </div>
                  </Label>
                </div>
                <div className="flex w-full items-center gap-2">
                  <Input
                    placeholder="Square images work best for avatars"
                    readOnly
                    value={avatarUrl || ""}
                  />
                  <CopyButton
                    disabled={!avatarUrl}
                    textToCopy={avatarUrl || ""}
                    toastMessage="Avatar URL copied to clipboard."
                    type="button"
                  />
                </div>
              </div>
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Author's full name"
              />
              {errors.name && (
                <ErrorMessage>{errors.name.message}</ErrorMessage>
              )}
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="unique-identifier"
              />
              {errors.slug && (
                <ErrorMessage>{errors.slug.message}</ErrorMessage>
              )}
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="author@example.com"
              />
              {errors.email && (
                <ErrorMessage>{errors.email.message}</ErrorMessage>
              )}
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Input
                id="role"
                {...register("role")}
                placeholder="e.g., Marketing Lead, Content Writer"
              />
              {errors.role && (
                <ErrorMessage>{errors.role.message}</ErrorMessage>
              )}
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Authors bio"
              />
              {errors.bio && <ErrorMessage>{errors.bio.message}</ErrorMessage>}
            </div>

            <div className="grid flex-1 gap-3">
              <Label htmlFor="socials">Socials (optional)</Label>

              {/* Social links - now all consistent */}
              <ul className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <li className="flex flex-col gap-1" key={field.id}>
                    <div className="flex items-center gap-2">
                      <div>
                        {getPlatformIcon(
                          watchedSocials?.[index]?.url
                            ? detectPlatform(watchedSocials[index].url)
                            : field.platform
                        )}
                      </div>
                      <Input
                        {...register(`socials.${index}.url`)}
                        className={cn(
                          errors.socials?.[index]?.url && "border-destructive"
                        )}
                        onChange={(e) => {
                          const newPlatform = detectPlatform(e.target.value);
                          setValue(`socials.${index}.platform`, newPlatform);
                          setValue(`socials.${index}.url`, e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors(`socials.${index}.url`);
                        }}
                        placeholder="Enter social media URL"
                      />
                      <Button
                        aria-label="Remove social link"
                        className="size-9 shadow-none"
                        onClick={() => remove(index)}
                        type="button"
                        variant="ghost"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                    {errors.socials?.[index]?.url && (
                      <ErrorMessage className="ml-8 text-xs">
                        {errors.socials[index].url.message}
                      </ErrorMessage>
                    )}
                  </li>
                ))}
              </ul>

              {fields.length < 5 && (
                <Button
                  className="w-fit shadow-none"
                  onClick={addSocialLink}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon className="size-4" />
                  Add Link
                </Button>
              )}

              {errors.socials?.message && (
                <ErrorMessage>{errors.socials.message}</ErrorMessage>
              )}
            </div>
          </div>

          <SheetFooter className="p-6">
            <AsyncButton
              className="flex w-full gap-2"
              disabled={(mode === "update" && !isDirty) || isUploading}
              isLoading={isSubmitting || isCreating || isUpdating}
              type="submit"
            >
              {mode === "create" ? "Create Author" : "Update Author"}
            </AsyncButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AuthorSheet;
