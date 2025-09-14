/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are unique within their respective modals */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import { ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import {
  checkAuthorSlugAction,
  checkAuthorSlugForUpdateAction,
} from "@/lib/actions/checks";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  authorSchema,
  type CreateAuthorValues,
} from "@/lib/validations/workspace";
import type { Author } from "@/types/author";
import { generateSlug } from "@/utils/string";
import { AsyncButton } from "../ui/async-button";
import { CopyButton } from "../ui/copy-button";

interface AuthorModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
  authorData?: Partial<Author>;
  onAuthorCreated?: (author: Author) => void;
}

export const AuthorModal = ({
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
  },
  onAuthorCreated,
}: AuthorModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
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
    },
  });

  const { name } = watch();
  const workspaceId = useWorkspaceId();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    authorData.image || null,
  );
  const [file, setFile] = useState<File | null>(null);
  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => {
      return uploadFile({ file, type: "author-avatar", });
    },
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

  const { mutate: createAuthor } = useMutation({
    mutationFn: (data: CreateAuthorValues) =>
      fetch("/api/authors", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create author");
        }
        return res.json();
      }),
    onSuccess: (data) => {
      setOpen(false);
      toast.success("Author created successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTHORS(workspaceId),
        });
      }
      if (onAuthorCreated) {
        onAuthorCreated(data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateAuthor } = useMutation({
    mutationFn: (data: CreateAuthorValues) =>
      fetch(`/api/authors/${authorData.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update author");
        }
        return res.json();
      }),
    onSuccess: () => {
      setOpen(false);
      toast.success("Author updated successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
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
    if (!file) return;
    uploadAvatar(file);
  }, [file, uploadAvatar]);

  useEffect(() => {
    if (file) {
      handleAvatarUpload();
    }
  }, [file, handleAvatarUpload]);

  const onSubmit = async (data: CreateAuthorValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    // Guard against missing author ID in update mode
    if (mode === "update" && !authorData.id) {
      toast.error("Author ID is missing - cannot update author");
      return;
    }

    const isTaken =
      mode === "create"
        ? await checkAuthorSlugAction(data.slug, workspaceId)
        : await checkAuthorSlugForUpdateAction(
            data.slug,
            workspaceId,
            authorData.id as string,
          );

    if (isTaken) {
      setError("slug", {
        message: "You already have an author with that slug",
      });
      return;
    }

    // Include the current avatar URL in the submission data
    const submissionData = {
      ...data,
      image: avatarUrl,
    };

    if (mode === "create") {
      createAuthor(submissionData);
    } else {
      updateAuthor(submissionData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            {mode === "create" ? "Create Author" : "Update Author"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mt-2"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="avatar">Avatar</Label>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="avatar"
                  className={cn(
                    "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                    isUploading && "pointer-events-none",
                  )}
                >
                  <Avatar className="size-16">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback>
                      <ImageIcon className="size-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <input
                    title="Upload avatar"
                    type="file"
                    id="avatar"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !isUploading) {
                        setFile(file);
                        handleAvatarUpload();
                      }
                    }}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black/50 backdrop-blur-xs size-full",
                      isUploading
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <UploadSimpleIcon className="size-4 text-white" />
                    )}
                  </div>
                </Label>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Input value={avatarUrl || ""} readOnly />
                <CopyButton
                  textToCopy={avatarUrl || ""}
                  disabled={!avatarUrl}
                  type="button"
                  toastMessage="Avatar URL copied to clipboard."
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
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>

          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="unique-identifier"
            />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
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
            {errors.role && <ErrorMessage>{errors.role.message}</ErrorMessage>}
          </div>

          <div className="grid flex-1 gap-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea id="bio" {...register("bio")} placeholder="Authors bio" />
            {errors.bio && <ErrorMessage>{errors.bio.message}</ErrorMessage>}
          </div>
          <AsyncButton
            type="submit"
            isLoading={isSubmitting}
            disabled={(mode === "update" && !isDirty) || isUploading}
            className="flex w-full gap-2 mt-4"
          >
            {mode === "create" ? "Create Author" : "Update Author"}
          </AsyncButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteAuthorModal = ({
  open,
  setOpen,
  id,
  name,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  id: string;
  name: string;
}) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteAuthor, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/authors/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => "Unknown error");
        throw new Error(errorText.error || "Failed to delete author");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Author deleted successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTHORS(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this author from your workspace. Any
            posts associated with this author will need to be reassigned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AsyncButton
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              deleteAuthor();
            }}
            isLoading={isPending}
          >
            Delete
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
