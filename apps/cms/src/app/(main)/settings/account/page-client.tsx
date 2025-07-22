"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { updateUserAction } from "@/lib/actions/account";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type ProfileData, profileSchema } from "@/lib/validations/settings";
import { useUser } from "@/providers/user";

function PageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser, isFetchingUser } = useUser();
  const [isChanged, setIsChanged] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.image ?? undefined,
  );
  const [file, setFile] = useState<File | null>(null);

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload avatar");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      updateUser({ image: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
      toast.success("Avatar updated successfully");
      setFile(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message);
    },
  });

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name ?? "", email: user.email ?? "" });
      setAvatarUrl(user.image ?? undefined);
    }
  }, [user, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      setIsChanged(value.name !== user?.name);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, user?.name]);

  const onSubmit = async (data: ProfileData) => {
    if (!user?.id) return;
    try {
      await updateUserAction({ name: data.name }, user.id);
      updateUser({ name: data.name });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
      toast.success("Account updated successfully.");
      setIsChanged(false);
      router.refresh();
    } catch (_error) {
      toast.error("Failed to update account.");
    }
  };

  const handleAvatarUpload = useCallback(() => {
    if (!file) return;
    uploadAvatar(file);
  }, [file, uploadAvatar]);

  useEffect(() => {
    if (file) {
      handleAvatarUpload();
    }
  }, [file, handleAvatarUpload]);

  return (
    <div className="flex flex-col gap-8 py-12">
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Profile Picture</CardTitle>
          <CardDescription>
            Your profile picture is visible to other members of the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Label
              htmlFor="avatar"
              className={cn(
                "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                isUploading && "pointer-events-none",
              )}
            >
              <Avatar className="size-16">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  <ImageIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <input
                title="Upload avatar"
                type="file"
                id="avatar"
                accept="image/*"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile && !isUploading) {
                    setFile(selectedFile);
                  }
                }}
                className="sr-only"
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-sm size-full",
                  isUploading
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadSimple className="size-4" />
                )}
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Full Name</CardTitle>
            <CardDescription>
              Your name will be displayed on your profile and in emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="name" className="sr-only">
                    Name
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="John Doe"
                    disabled={isFetchingUser}
                  />
                </div>
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              disabled={!isChanged || form.formState.isSubmitting}
              className="w-20 self-end"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <DeleteAccountModal />
        </CardFooter>
      </Card>
    </div>
  );
}

export default PageClient;
